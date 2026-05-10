# Supabase Waitlist Email Template

Endpoint `POST /api/waitlist` now sends an email through Supabase Auth using `inviteUserByEmail`.

## Setup

1. Open Supabase Dashboard.
2. Go to **Authentication -> Email Templates**.
3. Select template type **Invite user**.
4. Replace the subject and body with the template below.
5. Save and test by submitting an email from the landing page waitlist form.

## Recommended Subject

```
Samono waitlist confirmation
```

## HTML Template (Invite user)

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Samono Waitlist</title>
  </head>
  <body style="margin:0; padding:0; background:#060b13; font-family:Arial, sans-serif; color:#e6f1ff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#060b13; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px; background:#0b1220; border:1px solid #1f2a44; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 8px 28px;">
                <p style="margin:0; font-size:12px; letter-spacing:1.8px; color:#67e8f9;">SAMONO WAITLIST</p>
                <h1 style="margin:12px 0 0 0; font-size:28px; line-height:1.2; color:#f8fbff;">Welcome aboard.</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0 28px; font-size:16px; line-height:1.6; color:#c6d4ec;">
                <p style="margin:0 0 14px 0;">Hi {{ .Email }},</p>
                <p style="margin:0 0 14px 0;">You are now on the Samono waitlist. We will notify you first when beta access opens.</p>
                <p style="margin:0 0 18px 0;">No action is needed right now. We will email you again when access is ready.</p>
                <p style="margin:0 0 10px 0; font-size:13px; color:#8ea3c1;">If you did not request this, you can ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px 28px; border-top:1px solid #17233a; font-size:12px; color:#7f93b2;">
                <p style="margin:0 0 6px 0;">Samono</p>
                <p style="margin:0;">Watch-to-earn on Solana</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Text Alternative

```text
Hi {{ .Email }},

You are now on the Samono waitlist.
We will notify you first when beta access opens.
No action is needed right now.

If you did not request this, you can ignore this email.
```

## Notes

- This template is notification-only and intentionally does not display any URL/button.
- The current API still uses Supabase invite email flow under the hood.
