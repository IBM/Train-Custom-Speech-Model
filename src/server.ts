/**
 * Module dependencies.
 */
import * as bodyParser from "body-parser";
import * as compression from "compression";  // compresses requests
import * as express from "express";
import * as path from "path";
import * as util from "./util"

 /**
 * Routes
 */
import apiRouter from "./routes/api";

/**
 * API keys and Passport configuration.
 */
class App {

  // ref to Express instance
  public express: express.Application;

  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
    this.launchConf();
  }

  private middleware(): void {
    this.express.set("port", process.env.PORT || 3000);
    this.express.set("stt_service", util.getCfenv())
    this.express.use(compression());
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));
  }

  /**
   * Primary app routes.
   */
  private routes(): void {
    this.express.use("/api", apiRouter);
  }

  private launchConf() {

    /**
     * Start Express server.
     */
    this.express.listen(this.express.get("port"), () => {
      // tslint:disable-next-line:no-console
      console.log(("  App is running at http://localhost:%d \
      in %s mode"), this.express.get("port"), this.express.get("env"));
      // tslint:disable-next-line:no-console
      console.log("  Press CTRL-C to stop\n");
    });
  }
}

export default new App().express;
