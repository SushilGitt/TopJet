import React, { useEffect, useMemo, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  Frame,
  Icon,
  Banner,
  Stack,
  SkeletonPage,
  SkeletonBodyText,
  Modal,
  TextContainer,
} from "@shopify/polaris";
import { CircleTickMinor, CancelSmallMinor } from "@shopify/polaris-icons";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useAuthenticatedFetch } from "../hooks";

export default function Pricing() {
  const app = useAppBridge();
  const fetchAuth = useAuthenticatedFetch();
  const redirect = Redirect.create(app);

  const tick = useMemo(
    () => <Icon source={CircleTickMinor} color="success" />,
    []
  );
  const cross = useMemo(
    () => <Icon source={CancelSmallMinor} color="subdued" />,
    []
  );

  const [serverTier, setServerTier] = useState(null);
  const [loading, setLoading] = useState({ page: true, action: null });
  const [confirm, setConfirm] = useState({
    open: false,
    target: null,
    title: "",
    message: "",
  });
  const [banner, setBanner] = useState({ msg: "", status: null });

  const planPrices = {
    free: "0.00",
    basic: "10.00",
    premium: "15.00",
  };

  // Map backend tiers ➜ UI plans
  const selectedPlan = useMemo(() => {
    if (!serverTier) return null;
    if (serverTier === "free") return "free";
    if (serverTier === "basic") return "basic";
    if (serverTier === "premium") return "premium";
    return "free";
  }, [serverTier]);

  // Load current tier from backend
  async function refreshTier() {
    try {
      setLoading((s) => ({ ...s, page: true }));
      const res = await fetchAuth("/api/hasActiveSubscription");
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch subscription");
      }

      if (["free", "premium", "unlimited"].includes(data?.tier)) {
        setServerTier(data.tier);
      } else {
        setServerTier(data?.hasActiveSubscription ? "premium" : "free");
      }
    } catch (e) {
      console.error(e);
      setServerTier("free");
      setBanner({
        msg: "We couldn’t load your subscription details. Showing Free plan.",
        status: "critical",
      });
    } finally {
      setLoading((s) => ({ ...s, page: false }));
    }
  }

  useEffect(() => {
    refreshTier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelOf = (plan) =>
    plan === "free" ? "Free" : plan === "basic" ? "Basic" : "Premium";

  const openConfirm = (targetPlan) => {
    if (targetPlan === selectedPlan) {
      setBanner({
        msg: `You’re already using the ${labelOf(targetPlan)} plan.`,
        status: "warning",
      });
      return;
    }

    if (targetPlan === "free") {
      setConfirm({
        open: true,
        target: "free",
        title: "Move to the Free plan?",
        message:
          "This will cancel your paid subscription and switch you back to the Free tier. Advanced customization and visibility controls will be turned off.",
      });
      return;
    }

    const title =
      targetPlan === "basic" ? "Switch to Basic?" : "Upgrade to Premium?";
    const message =
      targetPlan === "basic"
        ? "The Basic plan lets you customize the button’s look and feel (colors, hover state, icon style) while keeping it visible on the homepage."
        : "The Premium plan unlocks every option — customize the button and show it on home, product, collection, and content pages across your store.";

    setConfirm({
      open: true,
      target: targetPlan,
      title,
      message,
    });
  };

  const runConfirm = async () => {
    const target = confirm.target;
    setConfirm((c) => ({ ...c, open: false }));
    await changePlan(target);
  };

  const changePlan = async (targetPlan) => {
    if (!targetPlan) return;

    try {
      setLoading((s) => ({ ...s, action: targetPlan }));

      // Downgrade to Free
      if (targetPlan === "free") {
        const res = await fetchAuth("/api/cancelSubscription");
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.error || "Cancel failed");

        if (data?.status && data?.status !== "No subscription found") {
          setBanner({
            msg: "Your subscription has been cancelled. You’re now on the Free plan.",
            status: "success",
          });
        } else {
          setBanner({
            msg: "There was no active subscription to cancel.",
            status: "warning",
          });
        }

        await refreshTier();
        return;
      }

      // Map UI plan ➜ backend plan
      const backendPlan = targetPlan; // "basic" or "premium" — matches billingConfig

      const res = await fetchAuth(
        `/api/createSubscription?plan=${backendPlan}`
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Create subscription failed");

      if (data?.isActiveSubscription) {
        await refreshTier();
        setBanner({
          msg: `${labelOf(targetPlan)} plan is already active on your store.`,
          status: "success",
        });
      } else if (data?.confirmationUrl) {
        setBanner({
          msg: "Redirecting you to Shopify billing to confirm the plan…",
          status: "success",
        });
        redirect.dispatch(
          Redirect.Action.REMOTE,
          String(data.confirmationUrl)
        );
      } else {
        throw new Error("No confirmation URL returned from billing.");
      }
    } catch (e) {
      console.error(e);
      setBanner({
        msg:
          targetPlan === "free"
            ? "We couldn’t cancel your subscription. Please try again."
            : "We couldn’t start the subscription. Please try again.",
        status: "critical",
      });
    } finally {
      setLoading((s) => ({ ...s, action: null }));
    }
  };

  const isCurrent = (plan) => selectedPlan === plan;

  const Feature = ({ enabled, children }) => (
    <Stack spacing="tight" alignment="center">
      {enabled ? tick : cross}
      <span style={{ color: "#111827", fontSize: 14 }}>{children}</span>
    </Stack>
  );

  // Loading skeleton while first fetch is in progress
  if (loading.page && !selectedPlan) {
    return (
      <Frame>
        <SkeletonPage title="Plans & billing" primaryAction>
          <Layout>
            {[1, 2, 3].map((k) => (
              <Layout.Section oneThird key={k}>
                <Card sectioned>
                  <SkeletonBodyText lines={6} />
                </Card>
              </Layout.Section>
            ))}
          </Layout>
        </SkeletonPage>
      </Frame>
    );
  }

  // Shared card styles
  const commonCardStyle = {
    borderRadius: 18,
    border: "1.5px solid #e8ecf1",
    position: "relative",
    overflow: "hidden",
    paddingTop: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "#FFFFFF",
  };

  const glowIfCurrent = (plan) =>
    isCurrent(plan)
      ? {
        boxShadow: "0 16px 40px rgba(40,167,69,0.18)",
        border: "2px solid #28A745",
        transform: "translateY(-4px)",
        background: "linear-gradient(180deg, #F4FBF6 0%, #ffffff 100%)",
      }
      : {};

  const FreeWatermark = () => (
    <div
      style={{
        position: "absolute",
        top: "46%",
        left: "-12%",
        transform: "rotate(-30deg)",
        fontSize: "40px",
        color: "rgba(15,23,42,0.04)",
        fontWeight: 700,
        pointerEvents: "none",
        userSelect: "none",
        textTransform: "uppercase",
      }}
    >
      Free plan
    </div>
  );

  const pillBase = {
    borderRadius: 999,
    padding: "3px 12px",
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const badgeStarter = {
    ...pillBase,
    backgroundColor: "#e5e7eb",
    color: "#374151",
  };

  const badgePopular = {
    ...pillBase,
    backgroundColor: "#28A745",
    color: "#ffffff",
  };

  const badgeFull = {
    ...pillBase,
    backgroundColor: "#1C7530",
    color: "#ffffff",
  };

  const badgeCurrent = {
    ...pillBase,
    backgroundColor: "#28A745",
    color: "#ffffff",
  };

  const getAccentColor = (plan) => {
    if (plan === "free") return "#6b7280";
    if (plan === "basic") return "#28A745";
    return "#1C7530";
  };

  const cardInner = {
    padding: "16px 18px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const headerRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  };

  const priceRow = {
    marginTop: 6,
    marginBottom: 4,
  };

  const featureBlock = {
    marginTop: 10,
    marginBottom: 12,
  };

  const buttonRow = {
    marginTop: 8,
    display: "flex",
    justifyContent: "center",
  };

  return (
    <Frame>
      {/* Confirm modal */}
      <Modal
        open={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        title={confirm.title}
        primaryAction={{
          content:
            confirm.target === "free"
              ? "Yes, switch to Free"
              : `Subscribe for $${planPrices[confirm.target]} / month`,
          onAction: runConfirm,
          loading: loading.action === confirm.target,
          destructive: confirm.target === "free",
        }}
        secondaryActions={[
          {
            content: "Go back",
            onAction: () => setConfirm((c) => ({ ...c, open: false })),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>{confirm.message}</p>
          </TextContainer>
        </Modal.Section>
      </Modal>

      <div className="premium-dashboard">
        <div className="content-wrapper" style={{ paddingTop: '48px', maxWidth: '1000px', margin: '0 auto' }}>

          {!!banner.msg && !!banner.status && (
            <div style={{ marginBottom: 24 }}>
              <Banner
                status={banner.status}
                onDismiss={() => setBanner({ msg: "", status: null })}
              >
                {banner.msg}
              </Banner>
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 className="hero-heading" style={{ color: '#1a1a2e', marginBottom: '12px' }}>
              Plans that grow with you
            </h1>
            <p className="hero-text" style={{ color: '#6b7280', margin: '0 auto' }}>
              Start free, unlock more when you're ready. No hidden fees.
            </p>
          </div>

          <div className="plan-grid">
            {/* FREE PLAN */}
            <div className={`plan-card ${isCurrent("free") ? "active" : ""}`}>
              {isCurrent("free") && <div className="plan-badge">Current Plan</div>}
              <span className="plan-name" style={{ color: getAccentColor("free") }}>Free Forever</span>
              <div className="plan-price">$0</div>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24, minHeight: 60, lineHeight: 1.6 }}>
                A clean scroll button on your homepage — zero cost, zero hassle.
              </p>

              <div style={{ padding: '24px 0', borderTop: '1px solid #eaeaea', borderBottom: '1px solid #eaeaea', marginBottom: 24, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Feature enabled={true}>Smooth scroll animation</Feature>
                <Feature enabled={false}>Custom colors & sizing</Feature>
                <Feature enabled={false}>Custom icon styling</Feature>
                <Feature enabled={false}>Product & Collection pages</Feature>
                <Feature enabled={true}>Mobile friendly</Feature>
              </div>

              <button
                className={isCurrent("free") ? "btn-light" : "btn-dark"}
                style={{ width: '100%' }}
                onClick={() => openConfirm("free")}
                disabled={isCurrent("free") || loading.action === "free"}
              >
                {isCurrent("free") ? "Active Plan" : "Downgrade to Free"}
              </button>
            </div>

            {/* BASIC PLAN */}
            <div className={`plan-card ${isCurrent("basic") ? "active" : ""}`} style={{ boxShadow: '0 20px 40px -10px rgba(40,167,69,0.12)', borderColor: isCurrent("basic") ? '#28A745' : '#BFE6CB', transform: 'scale(1.02)', zIndex: 2 }}>
              {!isCurrent("basic") && <div className="plan-badge" style={{ background: 'linear-gradient(135deg, #28A745, #1C7530)', color: '#fff' }}>Most Popular</div>}
              {isCurrent("basic") && <div className="plan-badge">Current Plan</div>}

              <span className="plan-name" style={{ color: getAccentColor("basic") }}>Basic</span>
              <div className="plan-price">$10 <span style={{ fontSize: 16, color: '#a3a3a3', fontWeight: 400 }}>/ mo</span></div>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24, minHeight: 60, lineHeight: 1.6 }}>
                Full design control — colors, icons & shapes to match your brand.
              </p>

              <div style={{ padding: '24px 0', borderTop: '1px solid #eaeaea', borderBottom: '1px solid #eaeaea', marginBottom: 24, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Feature enabled={true}>Smooth scroll animation</Feature>
                <Feature enabled={true}>Custom colors & sizing</Feature>
                <Feature enabled={true}>Custom icon styling</Feature>
                <Feature enabled={false}>Product & Collection pages</Feature>
                <Feature enabled={true}>Mobile friendly</Feature>
              </div>

              <button
                className="btn-dark"
                style={{ width: '100%', background: isCurrent("basic") ? '#ffffff' : undefined, color: isCurrent("basic") ? '#28A745' : undefined, border: isCurrent("basic") ? '1.5px solid #BFE6CB' : 'none' }}
                onClick={() => openConfirm("basic")}
                disabled={isCurrent("basic") || loading.action === "basic"}
              >
                {isCurrent("basic") ? "Active Plan" : "Upgrade to Basic"}
              </button>
            </div>

            {/* PREMIUM PLAN */}
            <div className={`plan-card ${isCurrent("premium") ? "active" : ""}`}>
              {isCurrent("premium") && <div className="plan-badge">Current Plan</div>}
              <span className="plan-name" style={{ color: getAccentColor("premium") }}>Premium</span>
              <div className="plan-price">$15 <span style={{ fontSize: 16, color: '#a3a3a3', fontWeight: 400 }}>/ mo</span></div>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24, minHeight: 60, lineHeight: 1.6 }}>
                Every feature, every page, priority support included.
              </p>

              <div style={{ padding: '24px 0', borderTop: '1px solid #eaeaea', borderBottom: '1px solid #eaeaea', marginBottom: 24, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Feature enabled={true}>Smooth scroll animation</Feature>
                <Feature enabled={true}>Custom colors & sizing</Feature>
                <Feature enabled={true}>Custom icon styling</Feature>
                <Feature enabled={true}>Product & Collection pages</Feature>
                <Feature enabled={true}>Priority Support</Feature>
              </div>

              <button
                className={isCurrent("premium") ? "btn-light" : "btn-dark"}
                style={{ width: '100%' }}
                onClick={() => openConfirm("premium")}
                disabled={isCurrent("premium") || loading.action === "premium"}
              >
                {isCurrent("premium") ? "Active Plan" : "Upgrade to Premium"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}
