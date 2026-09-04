# API contract

The contract implemented by the Hono routes, verified against the frontend wrappers. Endpoint paths are relative to each area's `/api` mount.

| Area         | Endpoints                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth         | `GET setup-status`, `POST setup`, `POST login`, `POST logout`, `POST register`, `GET me`                                                                                        |
| Projects     | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/archive`, `PATCH /:id/unarchive`, `PATCH /:id/add-task`, `PATCH /:id/remove-task`                         |
| Tasks        | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/favorite`, `PATCH /:id/restore`, `GET /jira-details`                                                      |
| Tags         | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`                                                                                                                                    |
| Time entries | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/duplicate`, `POST /reorder`, `GET /weekly-summary`, `GET /recent-description`, `POST /:id/push-to-jira`, `GET /export` |
| Daily notes  | `GET /:date`, `PUT /:date`, `GET /`, `GET /export`                                                                                                                              |
| Planner      | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`                                                                                                                                    |
| Profile      | `GET /`, `PATCH /`                                                                                                                                                              |
| Not exposed  | `GET /api/admin/database/export`, `POST /api/admin/database/import`                                                                                                             |

All domain endpoints require a cookie session. Owned-resource misses return 404. Validation normally returns `{ "error": string }` with 400. Unauthorized requests return 401 without redirect. JSON field names are camel-case. Tags and planner deletes return 204; most other successful deletes and reorder operations return 200 with an empty body.

Dates are calendar strings (`yyyy-MM-dd`) and API clocks are `HH:mm`. Audit timestamps are UTC and PostgreSQL returns them serialized as ISO-8601 UTC instants.
