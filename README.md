# Top End Resources — Staff Portal

**Live URL:** https://portal.topendresources.com.au

---

## Managing Staff Access

1. Log in as admin (TER-001)
2. Click **User Management** on the dashboard
3. Add or remove staff as needed
4. Click **Download users.json**
5. Upload `users.json` to this GitHub repo (replacing the existing file)
6. Changes take effect the next time each staff member connects to the internet

---

## Updating Project Data

Projects, work types, groups and locations are stored in `projects.json`.

To add/edit projects or locations:
1. Edit `projects.json` directly in GitHub
2. Upload the updated file
3. Forms will use updated data next time staff go online

---

## Files in this repo

| File | Purpose |
|------|---------|
| `index.html` | Portal login and dashboard |
| `worksreport.html` | Field worker works report form |
| `supervisorreport.html` | Supervisor daily report form |
| `onboarding.html` | New employee onboarding |
| `users.json` | Staff credentials — manage via User Management panel |
| `projects.json` | Project list, work types, locations |
| `sw.js` | Service Worker — enables offline mode |
| `manifest.json` | PWA config — enables Add to Home Screen |
| `TER-logo.png` | Company logo used across all pages |

---

## Offline Mode

The portal works offline after first use. On first visit:
- Open the portal while online
- Log in
- The app caches everything automatically

After that, forms can be completed offline. Submissions queue locally and upload automatically when internet is restored.

---

## SharePoint Structure

Reports upload to the following SharePoint paths:

```
HR/
  Onboarding/
    Surname, Firstname — YYYY-MM-DD/
      Personal_Details.pdf
      TFN_Withholding_Declaration.pdf
      Superannuation_Choice.pdf
      Agreements_and_Declarations.pdf
      Fair_Work_Statement.pdf
      Uploaded_Documents.pdf

OPERATIONS/
  PROJECTS/
    NTG23-0252-Drain Maintenance/
      Work Reports/
      Supervisor Reports/
    NTG24-0187-Firebreak Northern/
      Work Reports/
      Supervisor Reports/
    NTG24-0309-Firebreak Central/
      Work Reports/
      Supervisor Reports/
    SK5045-26-Eastern Road Main/
      Work Reports/
      Supervisor Reports/
    ST5013-26-Road Maintenance TC/
      Work Reports/
      Supervisor Reports/
```

---

## Tech Stack

- **Hosting:** GitHub Pages
- **Domain:** SiteGround DNS → CNAME to GitHub Pages
- **Auth:** Microsoft OAuth (staff with @ternt.com.au) + credentials login (TER-001 style)
- **API:** Microsoft Graph API via Cloudflare Worker
- **PDF:** jsPDF (browser-based, no server needed)
- **Offline:** Service Worker + localStorage queue

---

*Last updated: April 2026*
