# Admin Role Monitor Summary

## What was added

- Added a new admin-only screen/state: `Role Monitor`.
- Added an admin dashboard entry to open the monitor.
- Added a dedicated preview route: `/monitor-preview`.
- Added a left sidebar list of monitored users/roles (data-driven from users data).
- Added an embedded preview panel (iframe) that runs the full app flow, starting from login by default.

## How preview session isolation works

- Main app and monitor preview now use runtime-scoped storage keys.
- Main app keeps existing keys.
- Preview route uses namespaced keys derived from `/monitor-preview` + `ns` query param.
- Session (`zustand persist`) and live data persistence are isolated per preview namespace.
- Admin actions in the main session do not get overwritten by preview login/session state.

## How admin access is enforced

- Role Monitor entry is shown only when signed-in role is `admin`.
- Direct access to the monitor state is blocked for non-admin users with a restricted screen.
- Preview still resolves role/permissions from real user data inside the isolated preview session.

## Available controls

- Select monitored user (role, name, email) from sidebar.
- Reload preview.
- Reset preview session (uses a new isolated namespace).
- Open preview in a new tab.
- Optional convenience toggle: auto-login selected preview user.

## Limitations / future improvements

- Reset currently rotates namespace keys; old preview namespaces are not garbage-collected automatically.
- Optional enhancement: explicit “clear old preview namespaces” utility for admin.
- Optional enhancement: additional preview device presets (desktop/tablet) for monitoring ergonomics.
