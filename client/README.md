This client was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Run React App with Express API Server

Since this React app relies on the Express API backend server, it is best to run the following from
the project's root directory (one directory up):

```bash
npm run dev
```

This will start both the API server and the React app frontend.

## Project Structure

All handled routes are listed in `src/Routers.js`.
Each individual route has its own JavaScript and CSS file in the `src/pages` directory.
Reusable components are stored in the `src/components` directory. These are often imported
and used by the page scripts.

Some basic config options are also listed in `src/config.js`. Currently the only two config
options are:

  * `API_ENDPOINT`: The URL endpoint of the server hosting the API.
  * `MAX_AUDIO_SIZE`: The maximum size of audio files that users can upload for transcription.
  * `BASE_STT_MODEL`: The base model the custom models are built using. This option is used on
    the Transcribe page for users choosing not to use their customized models.


## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
