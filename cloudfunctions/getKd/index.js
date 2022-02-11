// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env:'daka-njtech-6gyw85k1b3a845c6'
})

// 云函数入口函数
exports.main = async (event, context) => {
    return await cloud.database().collection("buildingPoints")
        .where({
            name: event.name
        })
        .get()
}