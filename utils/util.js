// 地图marker的对象构造器
function createPoint(id, latitude, longitude, title, type) {
  this.id = parseInt(id);
  this.latitude = latitude;
  this.longitude = longitude;
  this.title = title;
  this.iconPath = '/images/定位.png'
  this.width = "50"
  this.height = "50"
  // this.customCallout = {
  //   display: "BYCLICK", //显示方式，可选值BYCLICK
  //   anchorX: 0, //横向偏移
  //   anchorY: 0,
  // }
  this.callout = {
    content: title,
    borderRadius: 10,
    padding: 10,
    display: "ALWAYS"
  }
}

module.exports = {
  createPoint
}
