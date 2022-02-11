// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'daka-njtech-6gyw85k1b3a845c6'
})
const db = cloud.database()
const _=db.command
// 云函数入口函数
exports.main = async (event, context) => {
    return await cloud.database().collection("buildingPoints")
        .where({
            name: db.RegExp({
                regexp: event.key_val,
                options: 'i'
            })
        })
        .get()
}