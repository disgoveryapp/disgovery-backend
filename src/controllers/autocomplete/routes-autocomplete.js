const Stop = require("../../models/Stop");
const APIStatus = require("../../configs/api-errors");
const { logger } = require("../../configs/config");
const sequelize = require("../../db/database");
const Fuse = require("fuse.js");
const { Op, QueryTypes } = require("sequelize");
const Fuzzy = require("../../functions/Fuzzy");

exports.getRoutesAutocomplete = async function getRoutesAutocomplete(req, res) {
    logger.info(`${req.method} ${req.baseUrl + req.path}`);

    const query = req.query.query;
    let routesID = []
    let infoData = []

    // if (!query) return res.send(APIStatus.BAD_REQUEST).status(APIStatus.BAD_REQUEST.status);

    const stopID = await sequelize.query(
        `
        SELECT routes.route_id,stop_times.stop_id,stop_code,stop_name
        FROM (  SELECT trip_id, route_id, maxStopSequence
                FROM (  SELECT trips.trip_id, route_id , maxStopSequence, ROW_NUMBER() over (PARTITION BY route_id ORDER BY maxStopSequence DESC ) AS rowNumber
                        FROM (  SELECT trip_id, MAX(stop_sequence) AS maxStopSequence
                                FROM stop_times
                                GROUP BY trip_id) AS trip_id_maxstopseq
                        INNER JOIN trips
                        ON trips.trip_id = trip_id_maxstopseq.trip_id) AS trips_route_maxstopseq
                WHERE rowNumber = 1) AS trip_route_maxstopseq
        INNER JOIN stop_times
        ON trip_route_maxstopseq.trip_id = stop_times.trip_id
        INNER JOIN stops
        ON stop_times.stop_id = stops.stop_id
        INNER JOIN routes ON trip_route_maxstopseq.route_id = routes.route_id;
        `,
        {
            type: QueryTypes.SELECT,
        },
    );


    const routes = await sequelize.query(
        `
        SELECT route_id,route_type, route_long_name FROM routes;
        `,
        {
            type: QueryTypes.SELECT,
        }
    );
    let routesObj = {}
    for (let items of Object.values(routes)){
        routesID.push(items["route_id"])
        let newKey = items["route_id"]
        let newValues = items["route_type"]

        let routeNames = items["route_long_name"]
        routesObj[newKey] = [newValues,routeNames]
        
    }

    

    const dataFuzzy = Fuzzy(routesID,query,3)
    for (let {item:i} of dataFuzzy){
        let tmpArrPathWays = []
        for(let paths of Object.values(stopID)){
            if (paths['route_id']==i){
                tmpArrPathWays.push({id:paths['stop_id'],code:paths['stop_id'].slice(4),name:{en:paths['stop_name'],th:null}})   //hereeeeee
            }
        }
        infoData.push({route_id:i,stations:tmpArrPathWays,type:routesObj[i][0],name:{en:routesObj[i][1],th:null}})   //hereeee
    }
    res.send(infoData)

};
