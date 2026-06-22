// @ts-check
import React, { useState, useEffect, useCallback } from "react";
import {
  Page,
  Modal,
  Frame,
  TopBar,
  Toast,
} from "@shopify/polaris";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { useNavigate } from "react-router-dom";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";

import "./index.css";

export default function HomePage() {
  const emptyToastProps = { content: null };
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const [selectedPlan, setSelectedPlan] = useState("free"); // default Free
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activateError, setActivateError] = useState(null);
  const [videoModalActive, setVideoModalActive] = useState(false);

  const app = useAppBridge();
  const fetch = useAuthenticatedFetch();
  const redirect = Redirect.create(app);
  const navigate = useNavigate();

  const toggleVideoModal = useCallback(
    () => setVideoModalActive((active) => !active),
    []
  );

  // --- Prices map ---
  const planPrices = {
    basic: "10.00",
    premium: "100.00",
  };

  const planLabels = {
    free: "Free",
    basic: "Basic",
    premium: "Premium",
  };

  // Fetch current plan
  const { data: subscriptionData, isLoading } = useAppQuery({
    url: "/api/hasActiveSubscription",
  });

  useEffect(() => {
    if (subscriptionData && subscriptionData.tier) {
      // Map backend tiers → frontend tiers
      let frontendTier = "free";
      if (subscriptionData.tier === "premium") frontendTier = "basic";
      if (subscriptionData.tier === "unlimited") frontendTier = "premium";
      setSelectedPlan(frontendTier);
    }
  }, [subscriptionData]);

  // --- Handle plan click ---
  const requestPlanChange = (plan) => {
    setConfirmPlan(plan);
    setShowConfirm(true);
  };

  const confirmSubscription = async () => {
    if (!confirmPlan) return;

    // Case 1: Already on this plan
    if (selectedPlan === confirmPlan) {
      setToastProps({ content: `You’re already using the ${planLabels[confirmPlan]} plan ✅` });
      setShowConfirm(false);
      return;
    }

    // Case 2: Switching to free (cancel subscription)
    if (confirmPlan === "free") {
      setLoadingPlan(confirmPlan);
      try {
        const res = await fetch("/api/cancelSubscription");
        const data = await res.json();

        if (data.status && data.status !== "No subscription found") {
          setSelectedPlan("free");
          setToastProps({
            content: "Subscription cancelled and moved to the Free plan ✅",
          });
        } else {
          setToastProps({ content: "Unable to cancel the subscription", error: true });
        }
      } catch (err) {
        setToastProps({ content: "Cancellation failed ❌", error: true });
      } finally {
        setLoadingPlan(null);
        setShowConfirm(false);
      }
      return;
    }

    // Case 3: Switching to paid plan
    setLoadingPlan(confirmPlan);

    // Map frontend → backend values
    let backendPlan = confirmPlan;
    if (confirmPlan === "basic") backendPlan = "premium"; // frontend basic = backend premium
    if (confirmPlan === "premium") backendPlan = "unlimited"; // frontend premium = backend unlimited

    try {
      const res = await fetch(`/api/createSubscription?plan=${backendPlan}`);
      const data = await res.json();
      if (data.confirmationUrl) {
        setToastProps({ content: "Taking you to Shopify billing to confirm…" });
        redirect.dispatch(Redirect.Action.REMOTE, data.confirmationUrl);
      } else if (data.error) {
        setToastProps({ content: data.error, error: true });
      }
    } catch (err) {
      setToastProps({ content: "Something went wrong during subscription ❌", error: true });
    } finally {
      setLoadingPlan(null);
      setShowConfirm(false);
    }
  };

  // --- Activate Scroll to Top Button (Theme Editor) ---
  const openThemeEditor = async () => {
    setActivateError(null);
    try {
      const response = await fetch("/api/getshop");
      if (!response.ok) throw new Error("Could not detect shop domain");
      const data = await response.json();
      if (!data.shop) throw new Error("Shop domain is missing");

      window.open(
        `https://${data.shop}/admin/themes/current/editor?context=apps`,
        "_blank"
      );
    } catch (error) {
      console.error("❌ Activate failed:", error);
      setActivateError(error.message);
    }
  };

  const toastMarkup =
    toastProps.content && (
      <Toast
        {...toastProps}
        onDismiss={() => setToastProps(emptyToastProps)}
      />
    );

  // --- Header setup ---
  const plans = ["free", "basic", "premium"];

  return (
    <Frame>
      <div className="premium-dashboard">
        {toastMarkup}
        
        {/* DARK HIGH-END HERO SECTION */}
        <div className="hero-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px', position: 'relative', zIndex: 1 }}>
            <span className="kicker">TopJet</span>
            <h1 className="hero-heading">
              One-tap back to top.<br />Smooth & beautiful.
            </h1>
            <p className="hero-text">
              Give your customers a polished, floating scroll button that matches your brand. Fully customizable, lightning fast, and works everywhere.
            </p>

            <ul className="dark-list">
              <li><strong>Buttery smooth</strong> scroll animation out of the box.</li>
              <li><strong>Brand-matched</strong> colors, icons & shapes you control.</li>
              <li><strong>Page-level rules</strong> — show it only where it matters.</li>
            </ul>

            <div style={{ marginTop: '32px' }}>
              <button className="btn-blur" onClick={toggleVideoModal}>
                Watch Setup Guide ▶️
              </button>
            </div>
          </div>

          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <div className="video-wrapper">
              <video
                src="https://cdn.shopify.com/videos/c/o/v/3b1a1e7263994b299f3af4f19630ef5f.mp4"
                controls
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="content-wrapper">
          
          {/* THEME EDITOR BANNER */}
          <div className="setup-banner">
            <div>
              <h2>Activate on Your Store</h2>
              <p>Enable the app embed in your theme to make the scroll button visible on your live storefront.</p>
            </div>
            <button className="btn-light" style={{ width: 'auto' }} onClick={openThemeEditor}>
              Open Theme Editor
            </button>
          </div>

          {/* ERROR BANNER */}
          {activateError && (
            <div style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444', padding: '16px', margin: '0 0 24px 0', borderRadius: '8px' }}>
              <p style={{ color: '#b91c1c', fontWeight: '500', fontSize: '14px' }}>{activateError}</p>
            </div>
          )}

          {/* PRICING PLANS */}
          <div className="saas-card">
            <div style={{ marginBottom: '8px' }}>
              <h2 className="section-heading">Choose Your Plan</h2>
              <p className="section-subheading">Start free, upgrade anytime. All billing handled securely by Shopify.</p>
            </div>

            {isLoading ? (
              <div style={{ color: '#737373', padding: '60px 0', textAlign: 'center', fontSize: '14px' }}>Loading your plan details...</div>
            ) : (
              <div className="plan-grid">
                {plans.map((plan) => {
                  const isActive = selectedPlan === plan;
                  return (
                    <div key={plan} className={`plan-card ${isActive ? 'active' : ''}`} onClick={() => !isActive && requestPlanChange(plan)}>
                      {isActive && <div className="plan-badge">Active Plan</div>}
                      <div className="plan-name">{planLabels[plan]}</div>
                      <div className="plan-price">
                        {plan === "free" ? "$0" : `$${planPrices[plan]}`} 
                        <span style={{ fontSize: '16px', color: '#a3a3a3', fontWeight: '500', marginLeft: '4px' }}>/ mo</span>
                      </div>
                      <p style={{ color: '#737373', fontSize: '14px', marginBottom: '32px', minHeight: '44px', lineHeight: '1.5' }}>
                        {plan === "free" ? "A clean scroll button on your homepage — zero cost." : plan === "basic" ? "Full design control — colors, icons & shapes." : "Every feature, every page, priority support."}
                      </p>
                      
                      {/* Pushes button to bottom if text heights vary slightly */}
                      <div style={{ marginTop: 'auto' }}>
                         <button className={isActive ? "btn-light" : "btn-dark"} disabled={isActive || loadingPlan === plan}>
                           {loadingPlan === plan ? "Loading..." : isActive ? "Currently Active" : `Upgrade to ${planLabels[plan]}`}
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* CONFIRMATION MODAL */}
        <Modal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Confirm plan change"
          primaryAction={{
            content:
              selectedPlan === confirmPlan
                ? "Okay, got it"
                : confirmPlan === "free"
                ? "Yes, cancel my subscription"
                : `Subscribe for $${planPrices[confirmPlan] || "0.00"} / month`,
            onAction: confirmSubscription,
            loading: loadingPlan === confirmPlan,
          }}
          secondaryActions={
            selectedPlan !== confirmPlan
              ? [{ content: "No, go back", onAction: () => setShowConfirm(false) }]
              : []
          }
        >
          <Modal.Section>
            {selectedPlan === confirmPlan ? (
              <p>You’re already on the <b>{(confirmPlan || "").toUpperCase()}</b> plan.</p>
            ) : confirmPlan === "free" ? (
              <p>Are you sure you want to cancel your <b>{selectedPlan.toUpperCase()}</b> subscription and move to the <b>FREE</b> plan?</p>
            ) : (
              <p>Do you want to switch to the <b>{(confirmPlan || "").toUpperCase()}</b> plan for <b>${planPrices[confirmPlan] || "0.00"}</b> per month?</p>
            )}
          </Modal.Section>
        </Modal>

        {/* VIDEO MODAL */}
        <Modal open={videoModalActive} onClose={toggleVideoModal} title="Quick setup guide">
          <Modal.Section>
            <div style={{ padding: "56% 0 0 0", position: "relative" }}>
              <iframe
                src="https://cdn.shopify.com/videos/c/o/v/bd24b7a578304e96a9fcfaaf27fabdc0.mp4"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                autoPlay
                style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "50%" }}
                title="Quick Setup"
              ></iframe>
            </div>
          </Modal.Section>
        </Modal>

      </div>
    </Frame>
  );
}
