import { AppShell } from "@/components/app-shell";
import { RootScreenController } from "@/components/root-screen-controller";

export default async function MonitorPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const emailParam = params.email;
  const autoLoginParam = params.autoLogin;
  const email = typeof emailParam === "string" ? emailParam : "";
  const autoLogin = (typeof autoLoginParam === "string" ? autoLoginParam : "0") === "1";

  return (
    <AppShell>
      <RootScreenController
        monitorPreview
        previewEmailPrefill={email}
        previewAutoLogin={autoLogin}
      />
    </AppShell>
  );
}
