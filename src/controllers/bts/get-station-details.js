const Translation = require('../../models/Translation')
exports.getStationDetails = async function getStationDetails(req, res) {
    let kuy1 = []
    const kuy = await Translation.findAll()
    kuy.forEach(x=>{
        kuy1.push(x.stop_name)
    })
    res.status(200).send(kuy1)
};