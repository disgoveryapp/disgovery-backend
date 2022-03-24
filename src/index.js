require("dotenv").config();
const express = require("express");
const sequelize = require("../src/db/database");
const { checkStructEnv, logger } = require("./configs/config");
const config = require("./configs/config");
const { getAllStops } = require("./functions/get-all-stops");
const router = require("./routers/routers");
const cors = require("cors");
const { getAllRoutes } = require("./functions/get-all-routes");
const { getAllStopsOfRoutes } = require("./functions/get-all-stops-of-route");

checkStructEnv();

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

sequelize
    .sync()
    .then(async () => {
        await (async () => {
            app.set("stops", await getAllStops());
            app.set("routes", await getAllRoutes());
            app.set("allStopsOfRoutes", await getAllStopsOfRoutes());
        })();

        app.listen(process.env.PORT || 3000, () => {
            logger.info("Server is up on port " + process.env.PORT || 3000);
        });
    })
    .catch((e) => {
        logger.error("ERROR: " + e);
    });
