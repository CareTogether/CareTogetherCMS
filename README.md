# CareTogetherCMS
CareTogether is an open-source case management system (CMS) for nonprofits connecting families to caring communities. [The wiki provides much more detail about the design of CareTogether.](https://github.com/CareTogether/CareTogetherCMS/wiki) If you prefer to jump straight into the code, keep reading!

![License](https://badgen.net/github/license/CareTogether/CareTogetherCMS)
![Open Help-Wanted Issues](https://badgen.net/github/label-issues/CareTogether/CareTogetherCMS/help%20wanted/open)
![Available Good First Issues](https://badgen.net/github/label-issues/CareTogether/CareTogetherCMS/good%20first%20issue/open)

## Contributing
Thank you for your interest in helping to build this vital tool! If you'd like to jump straight into development, please check out the [issues labeled "Help Wanted"](https://github.com/CareTogether/CareTogetherCMS/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22), which are tasks that have been identified as a good fit for initial contributions. They are intentionally not critically time-sensitive, so you can work on them at your own pace. We are tracking the overall status of those issues in [the CareTogether Contributions project](https://github.com/orgs/CareTogether/projects/2/views/1).

If you have additional time to dedicate to contributing and feel you're ready to take on larger chunks of feature development work, please contact [Lars Kemmann](https://github.com/LarsKemmann) to set up an introductory call and request an invite to Teams where we are coordinating the design, development, and support efforts for CareTogether.

### Collaboration Guidelines
We ask that you practice effective communication, preferably through comments on the GitHub issues:

1. Let others know that you are interested in working on an issue by leaving a comment.
2. As soon as you start working on an issue, create a *draft* pull request for it so that others can see any progress you have made.
3. Push changes to your PR frequently! We prefer small incremental commits over large changes that you keep locally for several days, so that others can see your progress.
4. Once you've completed developing *and testing* your changes locally, publish your draft PR so that maintainers will know to begin a PR review.
5. Stay responsive to comments on your PR.

## Prerequisites
You can build and run CareTogether on any operating system supported by Node.js and .NET Core, including Windows, MacOS, and supported Linux distros. CareTogether requires currently supported versions of Node.js and the .NET 6 SDK to be installed on your system.

You will also need to install [the Azurite emulator for Azure Storage](https://github.com/Azure/Azurite) and [the Yarn package manager](https://yarnpkg.com/getting-started/install):
```
npm install -g azurite yarn
```

## Development
1. Clone the repository into any local directory on your device, e.g. `D:\Code\CareTogetherCMS`.
2. Start Azurite from the command line with the `--loose` flag:
   ```
   azurite-blob --loose
   ```
   This will run Azurite with the default Blob service endpoint (we don't use the Queue or Table storage endpoints currently). Add a `--silent` parameter if you don't want to see individual requests logged to the terminal. The `--loose` parameter is currently required to support valet key access from the browser.
3. Run the _CareTogether.Api_ project:
   - If using **Visual Studio**, you can open the _CareTogetherCMS.sln_ solution and hit F5 to start debugging.
   - If using **Visual Studio Code**, you may first need to perform a `dotnet build` before you can debug.
   - If you just want to run the API **from the command line**, run the following from the _CareTogether.Api_ directory:
   ```
   dotnet run SolutionDir=..
   ```
   **NOTE:** The API project comes with a basic set of test data for local development. This test data is automatically regenerated each time you start the API project.
4. To run the _caretogether-pwa_ web application, run the following from the _caretogether-pwa_ directory:
   ```
   yarn install
   yarn start
   ```
5. To sign into the application's local test environment, use the following credentials:
   - Email Address: `test@bynalogic.com`
   - Password: `P@ssw0rd`

## Licensing Notice
CareTogether is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) which, crucially, **only permits hosting this software (including derivatives) if** you also make the source code of the software and any of your modifications available to your users under this same license. This effectively ensures that CareTogether CMS remains forever open-source and doesn't simply become the base code for a proprietary derivative at some point. We value collaboration and openness, and we believe that the best way to accomplish this is to ensure the software remains open to everyone.
