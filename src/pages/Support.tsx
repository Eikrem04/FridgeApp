import { PublicPageShell, Section } from '../components/legal/PublicPageShell'

export const Support = () => (
  <PublicPageShell title="Support">
    <p>
      Welcome to Kitch support. Below are answers to the most common questions — if you don't find what you need,
      contact us directly at the bottom of this page.
    </p>

    <Section heading="Account & password reset">
      <p>
        Forgot your password? On the sign-in screen, tap "Forgot password?" and enter your account email — you'll
        get a reset link by email within a few minutes. If it doesn't arrive, check your spam folder, and make sure
        you're checking the inbox for the email address you originally signed up with.
      </p>
      <p>
        Want to change your email or delete your account entirely? Both are handled in the app under{' '}
        <span className="font-medium text-[var(--color-ink)]">Settings</span>.
      </p>
    </Section>

    <Section heading="Barcode scanning">
      <p>
        Scanning uses your device's camera to read a product's barcode, then looks it up automatically. If a scan
        isn't working:
      </p>
      <ul className="ml-5 flex list-disc flex-col gap-1.5">
        <li>Make sure Kitch has camera permission (check your device's Settings app if you're not sure).</li>
        <li>Hold the barcode steady, well-lit, and fully in frame — a few centimeters back usually helps.</li>
        <li>Not every product is in the lookup database — you can always add the item manually instead.</li>
      </ul>
    </Section>

    <Section heading="Notification permission">
      <p>
        Kitch can remind you when items are about to expire, using notifications scheduled directly on your device.
        To turn this on, go to <span className="font-medium text-[var(--color-ink)]">Settings → Notifications</span>{' '}
        and allow alerts when prompted. If you previously denied permission, you'll need to re-enable it from your
        device's own system settings (iOS: Settings → Kitch → Notifications), since apps can't re-request a denied
        permission on their own.
      </p>
    </Section>

    <Section heading="Sync & troubleshooting">
      <p>
        Kitch syncs your inventory across all devices you're signed into automatically while you have an internet
        connection. If something looks out of date:
      </p>
      <ul className="ml-5 flex list-disc flex-col gap-1.5">
        <li>Check you're signed into the same account on both devices.</li>
        <li>Confirm you have an internet connection — changes made offline sync once you're back online.</li>
        <li>Try closing and reopening the app, which refreshes your data from the server.</li>
        <li>Make sure you're running the latest version of Kitch.</li>
      </ul>
    </Section>

    <Section heading="Deleting your account">
      <p>
        Go to <span className="font-medium text-[var(--color-ink)]">Settings → Delete Account</span> and confirm.
        This permanently removes your account and all associated data — this cannot be undone. See our{' '}
        <a href="/privacy" className="font-medium text-[var(--color-accent)]">
          Privacy Policy
        </a>{' '}
        for exactly what that includes.
      </p>
    </Section>

    <Section heading="Contact us">
      <p>
        Still stuck? Email us at{' '}
        <a href="mailto:support@kitchapp.no" className="font-medium text-[var(--color-accent)]">
          support@kitchapp.no
        </a>{' '}
        and we'll get back to you.
      </p>
    </Section>
  </PublicPageShell>
)
