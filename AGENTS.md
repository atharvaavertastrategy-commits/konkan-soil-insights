<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep soil demo copy in a single language dictionary so all report and map labels can be translated together.
- Keep soil data behind the asynchronous getSoilReport contract so a real API can replace the mock without changing the view.
- Load Leaflet dynamically after hydration so browser-only map code never executes during SSR.
- Keep the demo frontend-only and nonpersistent to preserve the requested stateless evaluation scope.
