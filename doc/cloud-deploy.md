# Deploy web app on IBM Cloud using Cloud Foundry

These are instructions for a quick deployment of the web app on IBM Cloud.

## Prerequisites

* Ensure that the [IBM Cloud CLI](https://cloud.ibm.com/docs/cli/index.html?locale=en-US#overview)
  tool is installed locally. Follow the instructions in the linked documentation to
  configure your environment.

## Update manifest.yml

In the `manifest.yml` file found in the root of the project, change the `route` value to a
unique route of your choosing by replacing the `your-host` placeholder. For example, route could be
`- route: my-stt-customizer.mybluemix.net`. Just make sure that the subdomain is not already taken.
This route corresponds to the URL for which the app will be accessible from. Also, feel free
to change the value for `name` which will correspond to the name of your Cloud Foundry app.

## Update client config.js

In `client/src/config.js`, update the params `API_ENDPOINT` and `WS_ENDPOINT` to use the route you
previously specified in the `manifest.yml` file. Using the above example route, this would be:

```
API_ENDPOINT: 'https://my-stt-customizer.mybluemix.net/api',
WS_ENDPOINT: 'wss://my-stt-customizer.mybluemix.net/',
```

> **NOTE**: Both `https` and `wss` are used because Cloud Foundry apps on the IBM Cloud are hosted using HTTPS.

## Make sure build files are up to date

From the root of the project, run:

```bash
npm run build
cd client && npm run build
```

If changes are made to the code, and the app needs to be updated, these will have to be run again.

## Watson credentials configuration

There are two ways to get your Watson STT credentials into your app.

**Option 1**

Use the `services.json` file for which a sample was provided. You only have to fill it out and
ensure it exists in the root of the project.

**Option 2**

Deploy the app, then connect your instance of the Watson STT service to the app.
  1) This can be done in the app dashboard after you initially deploy the app by
     selecting `Connections` in the left menu, then clicking on the `Create connection`
     button. After clicking on this button, you can select an existing
     `Speech to Text` service that you have access to. Your app can be found from the IBM Cloud
     [resource list](https://cloud.ibm.com/resources).
  2) After connecting the service, go to `Runtime` from the left menu, and select
     the `Environment variables` tab. You should now see the STT service in the
     `VCAP_SERVICES` section. Take note of the `name` of the service.
  3) Scroll down to the `User defined` environment variables section, and click `Add`, then
     add the following key-value pair, replacing the placeholder with your service name:
       - `STT_SERVICE_NAME:  <name of your STT service>`

---

The application first checks for the service in `VCAP_SERVICES` by searching for a name
corresponding to the environment variable `STT_SERVICE_NAME`. If these don't exist,
then the app will check for credentials in `services.json`. Some might find it preferable
just to use the `services.json` file, and push it with the app.

## Deploy the app

From the root of the project run:

```bash
ibmcloud cf push
```

This will push a new app or update the app on the IBM Cloud. You can view your apps online from the
IBM Cloud [resource list](https://cloud.ibm.com/resources).

## Visit deployed app

In a browser, navigate to `https://<your app route>`.
