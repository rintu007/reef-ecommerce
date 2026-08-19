-- Legacy's Announce tab could email all registered users in addition to the
-- in-app popup (two independent toggles: send_email / send_popup on one
-- broadcast action). The rebuild only ever had the popup half. emailed_at
-- tracks whether the one-time email blast has already gone out for a given
-- announcement, so the admin UI can guard against sending it twice.

alter table announcements
  add column emailed_at timestamptz;
