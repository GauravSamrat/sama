# Feedback system

The guided draft covers everyday problems, product ideas, improvements, bugs, automation and education. Product and category can be preselected from verified choices. Optional questions can be skipped or reviewed early. Session drafts exclude the email field. No attachments are accepted.

For production delivery, configure submissions.endpoint in studio.js with an approved HTTPS POST endpoint and allow its exact origin in Firebase Hosting’s connect-src directive. The site posts JSON with id, language and answers, a list of field/value pairs. Return an HTTP success response and JSON with the same id only after durable receipt. Retry uses the same ID if the draft is unchanged. The endpoint must impose a request size limit, validate allowed languages, categories, fields, enums and lengths, and rate limit before writing. Restrict CORS to the published origin. CORS does not replace an abuse control or authentication for admin access.

Store records privately. Key records on the request ID, check that retries match the same payload, and record timestamps, separate consent flags and status. Provide export and deletion privately. Review, investigate or plan only when a person changes status. Share an anonymized summary only after review and permission. Until an endpoint is approved, visitors can use verified public product issue trackers for redacted reports.
