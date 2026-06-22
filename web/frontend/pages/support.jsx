import { Card, Page, Layout, TextContainer, Text } from "@shopify/polaris";

export default function Support() {
  return (
    <Page title="Support">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <TextContainer>
              <Text variant="headingMd" as="h2">
                Need a hand with TopJet?
              </Text>
              <p>
                Questions, bugs, or feature requests — we're happy to help. Email
                us at{" "}
                <a href="mailto:support@solnix.store">support@solnix.store</a> and
                we'll get back to you within 24 hours.
              </p>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
