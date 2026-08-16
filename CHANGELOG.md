# Changelog

## [0.3.0](https://github.com/Jeremy0404/wishlist/compare/v0.2.0...v0.3.0) (2026-08-16)


### Features

* ask a magic-link sign-up for its name, and keep it editable ([#88](https://github.com/Jeremy0404/wishlist/issues/88)) ([68b8c56](https://github.com/Jeremy0404/wishlist/commit/68b8c56315fdec18f004e635afc5b6bf9544dd51))
* deploy to mediaserver on every tagged release ([9af5aba](https://github.com/Jeremy0404/wishlist/commit/9af5aba7528f651668dd4db47bdf581339a9fa9a))


### Bug Fixes

* make deploy/.env safe to source and to interpolate ([#83](https://github.com/Jeremy0404/wishlist/issues/83)) ([0b2e4cd](https://github.com/Jeremy0404/wishlist/commit/0b2e4cde480407f1340a929b274a31c785f47f9c))


### Miscellaneous

* add the mediaserver production deploy artifacts ([#81](https://github.com/Jeremy0404/wishlist/issues/81)) ([e545ecb](https://github.com/Jeremy0404/wishlist/commit/e545ecb337525da3edb7d8d10feb96c94ab8222c))

## [0.2.0](https://github.com/Jeremy0404/wishlist/compare/v0.1.0...v0.2.0) (2026-08-16)


### Features

* add magic-link authentication, keeping passwords as the fallback ([#68](https://github.com/Jeremy0404/wishlist/issues/68)) ([7f894f0](https://github.com/Jeremy0404/wishlist/commit/7f894f0ea62948824a2ca2bae32f26ff5e193231))
* Add Playwright E2E testing framework with containerized test environment and initial user authentication flows. ([9495c25](https://github.com/Jeremy0404/wishlist/commit/9495c258c3617d3ffbf4ba5f2dfaa30e4041a010))
* add the danger tokens and the destructive states they carry ([#62](https://github.com/Jeremy0404/wishlist/issues/62)) ([a4df548](https://github.com/Jeremy0404/wishlist/commit/a4df548b286d66a708ac246bb95222fb4b0af5f6))
* add the not-found and session-expired screens ([#75](https://github.com/Jeremy0404/wishlist/issues/75)) ([3ea0705](https://github.com/Jeremy0404/wishlist/commit/3ea07051c443dd5e708498cb2af5efa60bd759ba))
* added better error response ([f8ede29](https://github.com/Jeremy0404/wishlist/commit/f8ede2991f0c406c796279d01926f2de2879bbc4))
* added landing page ([010312e](https://github.com/Jeremy0404/wishlist/commit/010312e3c2672c600e4562afb9b1e6939e93300d))
* added logger ([5d8fadc](https://github.com/Jeremy0404/wishlist/commit/5d8fadc1e7102448e76cf5d21eac3a30e8cba18d))
* adopt the delivered mark as the favicon and the nav lockup ([#76](https://github.com/Jeremy0404/wishlist/issues/76)) ([7245210](https://github.com/Jeremy0404/wishlist/commit/7245210fbfbc227fc89730fba3038eab4a3ca63e))
* Better logo ([a0064a4](https://github.com/Jeremy0404/wishlist/commit/a0064a4bf65567204f4e8f777f52f5f71345c9aa))
* bring toasts onto the delivered pattern ([#72](https://github.com/Jeremy0404/wishlist/issues/72)) ([e134a57](https://github.com/Jeremy0404/wishlist/commit/e134a574cae94a8817dafd5b1a5fdb2455c2524f))
* Create wishlist when not exist + unique wishlist db constraint ([c3fe10e](https://github.com/Jeremy0404/wishlist/commit/c3fe10efdc88a01eb8a63890b43238381e257195))
* ensure family before list setup ([754f1ce](https://github.com/Jeremy0404/wishlist/commit/754f1cec277d8fef0fd4599095c5ba4d008ab679))
* fill an item's photo from the pasted product page ([#66](https://github.com/Jeremy0404/wishlist/issues/66)) ([811c1aa](https://github.com/Jeremy0404/wishlist/commit/811c1aac3bc5e264b6f8b8c9a555baad5fa3e53d))
* give a wishlist item an optional image ([#65](https://github.com/Jeremy0404/wishlist/issues/65)) ([c504427](https://github.com/Jeremy0404/wishlist/commit/c50442751ac3754ed77072002ae90da06ca43cfb))
* give empty and loading states one pattern ([#73](https://github.com/Jeremy0404/wishlist/issues/73)) ([c737a4b](https://github.com/Jeremy0404/wishlist/commit/c737a4be06d353f217675a7179c8299b06a1817a))
* give priority three levels, written into the existing column ([#64](https://github.com/Jeremy0404/wishlist/issues/64)) ([51fcb48](https://github.com/Jeremy0404/wishlist/commit/51fcb485448bfd5cb2091c479b8bf16032ef7aad))
* guards ([1c75f89](https://github.com/Jeremy0404/wishlist/commit/1c75f89b68d4f4f65ed15eba192e3a43feb46cd4))
* handle family join url ([f7ef086](https://github.com/Jeremy0404/wishlist/commit/f7ef0869b13b6eb7693f8f8e95a78220fdc04afd))
* handle redirection on login and register ([07b5b91](https://github.com/Jeremy0404/wishlist/commit/07b5b9182c44915b478e52f99ea282446522c98d))
* Implement user wishlist management and family creation/joining E2E tests. ([c31c179](https://github.com/Jeremy0404/wishlist/commit/c31c1798f14dde280e84d378778588c06d59d400))
* make family membership optional ([#43](https://github.com/Jeremy0404/wishlist/issues/43)) ([9156265](https://github.com/Jeremy0404/wishlist/commit/915626567f5d884263f45d5ea8dbe3efdb61588d))
* mint a readable share slug upfront and make sharing a toggle ([#46](https://github.com/Jeremy0404/wishlist/issues/46)) ([d48d27b](https://github.com/Jeremy0404/wishlist/commit/d48d27bd2af23e701dedb079f02c2c838632a8e3))
* put the share card and the invite nudge on top of My list ([#47](https://github.com/Jeremy0404/wishlist/issues/47)) ([782921b](https://github.com/Jeremy0404/wishlist/commit/782921b5a30b94c238602cc860e2e8eb930ebd3f))
* rebuild browse as a grid of person cards ([#42](https://github.com/Jeremy0404/wishlist/issues/42)) ([f04f0de](https://github.com/Jeremy0404/wishlist/commit/f04f0dee41bea751d813edd924edfaa09141247b))
* rebuild My list around a one-field quick add ([#49](https://github.com/Jeremy0404/wishlist/issues/49)) ([0206fef](https://github.com/Jeremy0404/wishlist/commit/0206fef9e7331cba9c77728faf5baa6ea070c64a))
* rebuild sign-in, merging landing, login and register ([#69](https://github.com/Jeremy0404/wishlist/issues/69)) ([d23dd32](https://github.com/Jeremy0404/wishlist/commit/d23dd324c3baf71ba6e1496ee0085e234c87e912))
* rebuild the person view on the new design ([#40](https://github.com/Jeremy0404/wishlist/issues/40)) ([0393b63](https://github.com/Jeremy0404/wishlist/commit/0393b63217f07769db8bb64c8f7c9739eb4b439e))
* rebuild the public share page on the design system ([#74](https://github.com/Jeremy0404/wishlist/issues/74)) ([7e6b7b9](https://github.com/Jeremy0404/wishlist/commit/7e6b7b9d2d7eeb92a0718132845868150f379cca))
* rebuild the three family screens on the design system ([#77](https://github.com/Jeremy0404/wishlist/issues/77)) ([23614a5](https://github.com/Jeremy0404/wishlist/commit/23614a5f5bee5c1e66c3f5f009d9e16b4e7178aa))
* resolve a pasted link into a title, price and image ([#48](https://github.com/Jeremy0404/wishlist/issues/48)) ([48846de](https://github.com/Jeremy0404/wishlist/commit/48846de662302e3f0e67593bac9c9ad8ead49362))
* restyle the export button and rebuild the exported document ([#67](https://github.com/Jeremy0404/wishlist/issues/67)) ([709c12f](https://github.com/Jeremy0404/wishlist/commit/709c12f0e8023e8923b664d855207d8f4e72411f))
* return item and reserved-by-me counts from the family listing ([#41](https://github.com/Jeremy0404/wishlist/issues/41)) ([3cbfaa2](https://github.com/Jeremy0404/wishlist/commit/3cbfaa2d96b943d5b82e7c3f630d19052f8ac17e))
* Top bar style ([6000d5d](https://github.com/Jeremy0404/wishlist/commit/6000d5daba2a11a0a4f153a59d5f54433fdffd4e))


### Bug Fixes

* build ([d92efbe](https://github.com/Jeremy0404/wishlist/commit/d92efbe335f20b815e3a4002d2369607bd6313b5))
* Dockerfile ([8329054](https://github.com/Jeremy0404/wishlist/commit/8329054e69466b07152d428cfbe654412d91aa52))
* ESM import ([2d0de3b](https://github.com/Jeremy0404/wishlist/commit/2d0de3bb72fa308af24162ab8e1f13526b95f831))
* ESM import ([04a8062](https://github.com/Jeremy0404/wishlist/commit/04a80621aa7c78de7dee60a9ea8149919890508b))
* ESM import ([5c58461](https://github.com/Jeremy0404/wishlist/commit/5c58461f25c3e3a919c82b32443224cf2e166c18))
* fixed broken routes ([3ffbdd6](https://github.com/Jeremy0404/wishlist/commit/3ffbdd6bf8965fac6178bcd4ff441c4082337ae5))
* Hidratation to not be sometimes redirect to login innappropriately ([349f043](https://github.com/Jeremy0404/wishlist/commit/349f04360964409c129e833bfb9a65b488be80e6))
* knex config file not found ([1fad2cc](https://github.com/Jeremy0404/wishlist/commit/1fad2cc4c2f5d8b6dcedc92c14939ee0f7fe11f7))
* knex config file not found ([1eed9ae](https://github.com/Jeremy0404/wishlist/commit/1eed9aef366a9c78e8ba0c6806657f7d33e7ba8a))
* migration ([80baf7d](https://github.com/Jeremy0404/wishlist/commit/80baf7d13060fbd556ec683a0a528cef512a3832))
* migration ([72d2d3c](https://github.com/Jeremy0404/wishlist/commit/72d2d3cd6469009bb4cc64e470086cb0cf4bfc0b))
* production api build ([ffbefbd](https://github.com/Jeremy0404/wishlist/commit/ffbefbd4728a865cc624157573e35776ae817e72))
* production build ([d7b5dba](https://github.com/Jeremy0404/wishlist/commit/d7b5dba9eea47b7a6ee3f91d7b374d83f6b68360))
* reservation ([e8f885d](https://github.com/Jeremy0404/wishlist/commit/e8f885db7cdd0ae7824f8eeb5a715a2baa8ced95))
* rootDir ([cf69e13](https://github.com/Jeremy0404/wishlist/commit/cf69e138dccb0ed8d1bb282e1b38f34ab006352c))
* rootDir ([5d4d94e](https://github.com/Jeremy0404/wishlist/commit/5d4d94e892db8fb70c05be50bf5271d3008c0774))
* tests ([2e47f1c](https://github.com/Jeremy0404/wishlist/commit/2e47f1cb974d706c9b1ccfff8166e835372ff50a))
* tsconfig.json Create dist at the right place ([40e56f7](https://github.com/Jeremy0404/wishlist/commit/40e56f7d101d6599f366ca76317ac09847907d99))
* types ([d899dea](https://github.com/Jeremy0404/wishlist/commit/d899deaae880fc1c90532ce2e8069f9dc455c1fc))
* Wishlist never created ([8524f3e](https://github.com/Jeremy0404/wishlist/commit/8524f3eda18c9c35f5d56e19ab4ab1256fbe199c))


### Miscellaneous

* add lint, typecheck and issue workflow ([#26](https://github.com/Jeremy0404/wishlist/issues/26)) ([4f3e31a](https://github.com/Jeremy0404/wishlist/commit/4f3e31a51c92f34b848ee7e05b57fd4443e1c916))
* add release-please and a signed release pipeline ([#79](https://github.com/Jeremy0404/wishlist/issues/79)) ([d928dff](https://github.com/Jeremy0404/wishlist/commit/d928dfffd58f41285586b7a5f606a7fb6e449d49))
* added logs ([2b3a11e](https://github.com/Jeremy0404/wishlist/commit/2b3a11e06b917b1dc2597e63b30a47a948b131b3))
* added unique constraint on userId ([c381042](https://github.com/Jeremy0404/wishlist/commit/c38104279f703190a247f69bfa8c4748bddddea9))
* better hydratation ([4d1752c](https://github.com/Jeremy0404/wishlist/commit/4d1752cccdc08c996c45f6d9e156b24d087d751f))
* better others list ([78f2118](https://github.com/Jeremy0404/wishlist/commit/78f2118986502656dc8fea233632b4a04ee36066))
* database connection ([25b16f0](https://github.com/Jeremy0404/wishlist/commit/25b16f08fb77be70315bc037e6b2251666794787))
* devops ([a6f45a3](https://github.com/Jeremy0404/wishlist/commit/a6f45a3cc1ec5eac7dccebeee4ab419bece7264a))
* family code generation ([b7f5a9b](https://github.com/Jeremy0404/wishlist/commit/b7f5a9b79bd85d9336f254cf02869ea7228db2a6))
* handle unauthorized api call ([ff66d12](https://github.com/Jeremy0404/wishlist/commit/ff66d12d8a5304fb59191cf7f16131d399695a76))
* initial commit (api + web + compose + knex) ([a050d06](https://github.com/Jeremy0404/wishlist/commit/a050d06bddc1dff5a00a9d927f075887fefe2693))
* landing wording ([f81c085](https://github.com/Jeremy0404/wishlist/commit/f81c085cde320b6a535ea5bc307e8292446499ed))
* login and register pages ([af4855d](https://github.com/Jeremy0404/wishlist/commit/af4855d62789c4f38e156e975bb3a34f27f5fd8c))
* make production deploy manual-only ([#25](https://github.com/Jeremy0404/wishlist/issues/25)) ([bc8f2ba](https://github.com/Jeremy0404/wishlist/commit/bc8f2ba8b0c74eb7d4184b0727001f06e321634d))
* make the documented onboarding actually work ([#51](https://github.com/Jeremy0404/wishlist/issues/51)) ([91abe0a](https://github.com/Jeremy0404/wishlist/commit/91abe0ad871d86a909be584a06c8a7ebb204a031))
* port the organic design tokens into tailwind and build the primitives ([#39](https://github.com/Jeremy0404/wishlist/issues/39)) ([a91e8b7](https://github.com/Jeremy0404/wishlist/commit/a91e8b7c8d75fca9e49f7f9c0048718e5e9e4c64))
* rate limit the auth endpoints ([#78](https://github.com/Jeremy0404/wishlist/issues/78)) ([262c9e0](https://github.com/Jeremy0404/wishlist/commit/262c9e07cd38b45fbecd10711c8f2ef7d2afe55a))
* Rework all styles ([82e2f6a](https://github.com/Jeremy0404/wishlist/commit/82e2f6ad816754bf4a2ffef48223f0f1fdc663ec))
* rework request method ([6288415](https://github.com/Jeremy0404/wishlist/commit/628841527ef2836cc2a5797e565864faff78a0c2))
* Rework share buttons ([86387db](https://github.com/Jeremy0404/wishlist/commit/86387db61f833c91df16a3e0ecc74e7712325e64))
* Reworks reservation UI ([265f10c](https://github.com/Jeremy0404/wishlist/commit/265f10c8c450a4a3c3e921b052495af0c5be14f3))
* rewrite the message catalogue for a year-round app ([#50](https://github.com/Jeremy0404/wishlist/issues/50)) ([120b829](https://github.com/Jeremy0404/wishlist/commit/120b8293afe9032adf94c64ee0447b4dda98b7fd))
* security + Family share features ([020226a](https://github.com/Jeremy0404/wishlist/commit/020226a2c61e2f0fa72cdfcf391b996dce94524d))
* tmp change exposition port ([1ed4be7](https://github.com/Jeremy0404/wishlist/commit/1ed4be771192387fc9cae73cbbf2dac759bce08e))
* translate ([521b936](https://github.com/Jeremy0404/wishlist/commit/521b936e16ffeb2b58ec9d96e97becbee303c87a))
* translations ([efd084a](https://github.com/Jeremy0404/wishlist/commit/efd084a4dce2c130e9953cdd788b1649b3a3a5d9))
* use euros instead of cents ([f63ecee](https://github.com/Jeremy0404/wishlist/commit/f63ecee449507e45f8e016747915b2ea5c8b8ffc))
