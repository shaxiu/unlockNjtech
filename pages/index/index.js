// pages/index/index.js
const API = require("../../promise/wxAPI.js")
const Util = require("../../utils/util.js")
Page({

    /**
     * 页面的初始数据
     */
    data: {
        selectMarkerId: -1,
        markers: [],
        la: 32.082549,
        ln: 118.639871,
        userLa: 32.082549,
        userLn: 118.639871,
        scale: 17,
        isSettingLocation: false, // 用户是否开启定位权限
        layerName: "2d",
        enable3D: false,
        enableSatellite: false,
        skew: 0,
        tool_active: '',
        viewShowed: false, //显示结果view的状态
        inputVal: "", // 搜索框值
        serachList: [], //搜索渲染推荐数据,
        classRoomList: [],
        tmp_lh: {}, //临时存储教学楼point
        tmp_kd:{}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 页面显示时，需获取用户位置
     */
    onShow: function () {
        let that = this
        // 判断是否获得定位权限
        wx.getSetting().then(res => {
            // 判断是否有这个设置，没有的话要调用一个wx.getLocation
            if (res.authSetting["scope.userLocation"] == undefined || res.authSetting["scope.userLocation"] == null) {
                // scope.userLocation不存在，需要调用一次getLocation
                console.log("scope.userLocation不存在");
                // 定位到用户所在地
                that.locate(0)
            } else if (!res.authSetting["scope.userLocation"]) {
                // 有这个设置时，判断是否开启授权
                throw new Error("未获得定位权限")
            } else {
                console.log("已获得定位权限");
                that.data.isSettingLocation = true
                // 定位到用户所在地
                that.locate()
            }
        }).catch(err => {
            wx.hideLoading()
            console.log("未获得定位权限", err);
            return API.ShowModal('未获得定位权限', '请点击右上角设置-位置消息，赋予本小程序定位权限！', false)
        })
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },
    locate: function (type = 1) {
        let that = this
        // 判断是否获得用户权限
        if (!that.data.isSettingLocation && type) {
            console.log("用户未打开权限，无法定位");
            return API.ShowModal('未获得定位权限', '请点击右上角设置-位置消息，赋予本小程序定位权限！', false)
        }
        // 加载中
        wx.showLoading({
            title: '定位中',
        })
        // 获取用户最新位置
        wx.getLocation({
            type: 'gcj02'
        }).then(res => {
            // 如果顺利拿到数据，则说明用户已经授予权限。当第一次调用getLocation时，由系统弹出是否给予定位权限，此时需要置isSettingLocation为真。
            // 如果没有拿到数据，也可能是用户关闭了定位
            if (!type) {
                that.data.isSettingLocation = true
            }
            // 移动位置
            wx.hideLoading()
            // 保存用户位置
            that.data.userLa = res.latitude
            that.data.userLn = res.longitude
            // 移动位置
            that.moveToLocation(res.latitude, res.longitude)
            that.setData({
                notShowLabel: true,
                scale: 17,
            })
        }).catch(err => {
            // 在初次授权时，没拿到数据也要置isSettingLocation为真。
            if (!type && err.errCode == 2) {
                that.data.isSettingLocation = true
            }
            wx.hideLoading().then(() => {
                API.ShowModal('定位失败', "请确认已打开定位功能!", false)
            })
            console.log("定位到用户所在位置失败", err);
            // 用户既未授权定位，又未获取到markers的时候，需要判断是否可以移动
            that.moveToLocation(that.data.userLa, that.data.userLn)
        })
    },
    moveToLocation: function (latitude, longitude) {
        let that = this
        console.log(`移动到`, latitude, longitude);
        // 设置视图中心
        that.setData({
            la: latitude,
            ln: longitude
        })
        console.log(that.data.la, that.data.ln)
    },
    chooseLayer: function (e) {
        this.setData({
            modalName: e.currentTarget.dataset.target
        })
    },
    hideModal(e) {
        this.setData({
            modalName: null
        })
    },
    ensureLayer: function (e) {
        console.log('yes')
        let that = this
        let layerName = e.currentTarget.dataset.target
        if (layerName != this.data.layerName) {
            if (layerName == "2d") {
                that.setData({
                    layerName: layerName,
                    enableSatellite: false,
                    enable3D: false,
                    skew: 0
                })
            } else if (layerName == "3d") {
                that.setData({
                    layerName: layerName,
                    enableSatellite: false,
                    enable3D: true,
                    skew: 40
                })
            } else {
                this.setData({
                    layerName: layerName,
                    enableSatellite: true,
                    enable3D: false,
                    skew: 0
                })
            }
        }
    },
    showPoint: function (e) {
        let that = this;
        let type = e.currentTarget.dataset.type;
        console.log(type)
        wx.showLoading({
            title: '加载中',
        })
        wx.cloud.callFunction({
                name: 'getPoints',
                data: {
                    type: type
                }
            })
            .then(res => {
                var result = res.result.data
                let _markers = [];
                for (let item of result) {
                    // 构造marker数据
                    var point = new Util.createPoint(item["flag"], item["lat"], item["lng"], item["name"]);
                    _markers.push(point);
                }
                that.setData({
                    markers: _markers,
                    tool_active: type
                })
                wx.hideLoading()
            }).catch(res => {
                console.log("请求失败", res)
            })
    },
    markertap: function (e) {
        let that = this
        // 注意markerId并不等于序号
        let marker = this.data.markers.filter(function (x) {
            return x.id == e.detail.markerId;
        })[0];
        // 如果选中的marker与上一次一致，就不要移动视图

        that.data.selectMarkerId = e.detail.markerId
        // 移动位置
        that.moveToLocation(marker.latitude, marker.longitude)
        that.setData({
            //   address: marker.address,
            //   title: marker.title,
            //   distance: util.getDistance(parseFloat(that.data.userLa), parseFloat(that.data.userLn), parseFloat(marker.latitude), parseFloat(marker.longitude)),
            notShowLabel: false,
            //   tele: marker.tel,
            scale: 18
        })
        let lh = '';
        let kd='';
        switch (marker.title) {
            case '厚学楼':
                lh = '厚学楼';
                break;
            case '笃学楼C楼':
                lh = '浦江C楼';
                break;
            case '笃学楼B楼':
                lh = '浦江B楼';
                break;
            case '笃学楼A楼':
                lh = '浦江A楼';
                break;
            case '仁智楼':
                lh = '仁智楼';
                break;
            case '同和楼':
                lh = '同和楼'
                break;
            case '明德快递点':
                kd='明德快递点'
                break;
            case '西苑快递点':
                kd='西苑快递点'
                break;
            case '亚青快递点':
                kd='亚青快递点'
                break;
            case '东苑快递点':
                kd='东苑快递点'
                break;
            case '龙华快递点':
                kd='龙华快递点'
                break;
        }
        if (lh == ''&&kd=='') {
            let plugin = requirePlugin('routePlan');
            let key = 'NLDBZ-4V3WJ-ZI2FI-FIQSX-MK4UO-UJBU2'; //使用在腾讯位置服务申请的key
            let referer = '解锁南工大'; //调用插件的app的名称
            let mode = 'walking';
            let navigation = 1;
            let endPoint = JSON.stringify({ //终点
                'name': marker.title,
                'latitude': marker.latitude,
                'longitude': marker.longitude
            });
            wx.navigateTo({
                url: 'plugin://routePlan/index?key=' + key + '&referer=' + referer + '&endPoint=' + endPoint + '&mode=' + mode + '&navigation=' + navigation
            });
        } else if(lh!=''){
            wx.showLoading({
                title: '加载中',
            })
            wx.cloud.callFunction({
                    name: 'getClassroom',
                    data: {
                        lh: lh
                    }
                })
                .then(res => {
                    var result = res.result.data
                    this.setData({
                        modalName: 'classRoomModal',
                        classRoomList: result,
                        temp_lh: marker
                    })
                    wx.hideLoading()
                }).catch(res => {
                    console.log("请求失败", res)
                })
        }else{
            wx.showLoading({
                title: '加载中',
            })
            wx.cloud.callFunction({
                    name: 'getKd',
                    data: {
                        name: kd
                    }
                })
                .then(res => {
                    var result = res.result.data
                    console.log(result)
                    this.setData({
                        modalName: 'kdModal',
                        tmp_kd: result[0]
                    })
                    wx.hideLoading()
                }).catch(res => {
                    console.log("请求失败", res)
                })
        }

    },
    /**
     * 搜索框
     * 进行模糊搜索,点击跳转到对应点
     */
    hideInput: function () {
        this.setData({
            inputVal: "",
            viewShowed: false,
        });
    },

    /**
     * 输入框，键盘抬起事件
     * @param {*} e 
     */
    inputTyping: function (e) {
        // console.log("input-----",e)
        let value = e.detail.value
        let that = this;
        let markers = that.data.markers
        if (value == '') {
            that.setData({
                viewShowed: false,
            });
        } else {
            //“这里需要特别注意，不然在选中下拉框值的时候，下拉框又出现”
            if (e.detail.cursor) { //e.detail.cursor表示input值当前焦点所在的位置
                wx.cloud.callFunction({
                        name: 'searchPoints',
                        data: {
                            key_val: value
                        }
                    })
                    .then(res => {
                        var result = res.result.data
                        that.setData({
                            viewShowed: true,
                            serachList: result
                        });
                        wx.hideLoading()
                    }).catch(res => {
                        console.log("请求失败", res)
                    })
            }
        }
    },
    name: function (res) {
        let that = this;
        console.log(res.currentTarget.dataset.index);
        let index = res.currentTarget.dataset.index;
        console.log(that.data.serachList[index]);
        that.setData({
            inputVal: that.data.serachList[index].name,
            viewShowed: false
        })
        let plugin = requirePlugin('routePlan');
        let key = 'NLDBZ-4V3WJ-ZI2FI-FIQSX-MK4UO-UJBU2'; //使用在腾讯位置服务申请的key
        let referer = '解锁南工大'; //调用插件的app的名称
        let mode = 'walking';
        let navigation = 1;
        let endPoint = JSON.stringify({ //终点
            'name': that.data.serachList[index].name,
            'latitude': that.data.serachList[index].lat,
            'longitude': that.data.serachList[index].lng
        });
        wx.navigateTo({
            url: 'plugin://routePlan/index?key=' + key + '&referer=' + referer + '&endPoint=' + endPoint + '&mode=' + mode + '&navigation=' + navigation
        });
    },
    // 隐藏信息框
    hideLabel: function () {
        this.setData({
            inputVal: "",
            notShowLabel: true
        })
    },
    searchClassroom: function () {
        wx.navigateToMiniProgram({
            appId: 'wxe314f48b689deaf6',
            shortLink: '#小程序://weNjtech/班车时刻/Q4mwPp9rycC3oyw'
        })
    },
    goThere: function (e) {  
        let plugin = requirePlugin('routePlan');
        let key = 'NLDBZ-4V3WJ-ZI2FI-FIQSX-MK4UO-UJBU2'; //使用在腾讯位置服务申请的key
        let referer = '解锁南工大'; //调用插件的app的名称
        let mode = 'walking';
        let navigation = 1;
        let endPoint;
        if(e.currentTarget.dataset.target=='lh'){
            let marker = this.data.temp_lh
             endPoint = JSON.stringify({ //终点
                'name': marker.title,
                'latitude': marker.latitude,
                'longitude': marker.longitude
            });
        }else{
            let marker=this.data.tmp_kd;
             endPoint = JSON.stringify({ //终点
                'name': marker.name,
                'latitude': marker.lat,
                'longitude': marker.lng
            });
        }
        
        wx.navigateTo({
            url: 'plugin://routePlan/index?key=' + key + '&referer=' + referer + '&endPoint=' + endPoint + '&mode=' + mode + '&navigation=' + navigation
        });
    }
})