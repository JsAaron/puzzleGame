/****************************************************************
*        拼图游戏
*            @by Aaron
*        blog:http://www.cnblogs.com/AaronJs/
 *****************************************************************/
/**
 * 拼图游戏构造器
 * contentArea 文本区域
 * imageSrc	   图片地址
 * @return {[type]} [description]
 */
function puzzleGame(contentArea, imageSrc, level) {

    //显示图片节点
    this.$contentArea = $(contentArea)
    this.imageSrc = imageSrc;

    //显示区域的尺寸
    this.contentWidth  = parseInt(this.$contentArea.css('width'))
    this.contentHeight = parseInt(this.$contentArea.css('Height'))

    var offset = this.$contentArea.offset()
    this.contentLeft   = offset.left;
    this.contentTop    = offset.top

    //操作的活动范围
    this.range = {
        top    : this.contentTop,
        bottom : this.contentWidth + this.contentLeft,
        right  : this.contentHeight + this.contentTop,
        left   : this.contentLeft
    }

    //定义级别难度
    this.level = {
        row: 3, //横行 x
        col: 3  //column 竖行 y
    }

    this.aminTime   = 350; //记录animate动画的运动时间，默认350毫秒

    //是否动作进行中
    this.isAminRun = false

    //游戏是否已经开始
    this.gameIsStart = false;

    //初始化创建
    this.initCreate();

    //绑定全局事件
    this.creatEvent();
}


puzzleGame.prototype = {

    //初始化
    initCreate: function() {
        //计算每一个碎片图片的应该有的尺寸
        this.debriesSize();
        //初始化布局
        this.initLayer(this.level.row, this.level.col);
    },

    //计算碎片尺寸
    //计算每一个碎片图片的应该有的尺寸
    debriesSize: function() {
        this.debrisWidth = this.contentWidth / this.level.row;
        this.debrisHeight = this.contentHeight / this.level.col;
    },

    //布局
    //3 * 3 默认
    initLayer: function(row, col) {
        var index;
        var debrisDiv; //每一个碎片图片节点
        var debrisWidth  = this.debrisWidth;
        var debrisHeight = this.debrisHeight;

        //临时文档碎片
        var fragment = document.createElement('createDocumentFragment');
        var $fragment  = $(fragment);

        //布局的原始排序
        this.originalOrder = [];
        //碎片快速索引
        this.$debrisMap    = {};

        //生成 row * col 的矩阵
        for (var i = 0; i < row; i++) {
            for (var j = 0; j < col; j++) {
                debrisDiv = $(document.createElement('div')).css({
                    'float'                      : 'left',
                    'border'                     : '1px solid red',
                    'border-radius'              : '5px',
                    'position'                   : 'absolute',
                    'z-index'                    : 5,
                    'box-shadow'                 : '0px 0px 15px #fff',
                    'width'                      : (debrisWidth - 2) + 'px',
                    'height'                     : (debrisHeight - 2) + 'px',
                    'left'                       : j * debrisWidth + 'px',
                    'top'                        : i * debrisHeight + 'px',
                    "background"                 : "url('" + this.imageSrc + "')",
                    'backgroundPosition'         : (-j) * debrisWidth + 'px ' + (-i) * debrisHeight + 'px'
                });
                $fragment.append(debrisDiv)

                //用来对比随机后正确的顺序
                index = i * col + j;
                this.originalOrder.push(index);
                //保存碎片节点合集
                this.$debrisMap[index] = debrisDiv
            }
        }
        this.$contentArea.html('').append(fragment.childNodes);
    },

    //检测游戏状态
    checkGameStauts: function() {
        if (this.gameIsStart) {
            return true;
        }
    },

    //开始游戏
    startGame: function() {
        this.gameIsStart = true
        //计算随机数
        var randomOrder = this.calculateRandom();
        //根据随机数随机布局
        this.randomLayout(randomOrder);

        this.$contentArea.css({
            'cursor': 'pointer'
        })
    },

    //复位
    resetGame: function(row, low) {
        this.gameIsStart = false;
        this.isAminRun   = false;
        if(row && low){
            this.setGameLevel(row,low)
            return
        }
        //复位布局
        this.restLayout(this.originalOrder)
        //更新randomOrder值
        this.randomOrder = this.originalOrder; 
    },

    //获取游戏状态
    getGameStatus:function(){
        return this.gameIsStart
    },

    //设置游戏的困难度
    setGameLevel: function(row, col) {
        if(this.checkGameStauts()){
            return
        }
        //设置新的级别
        this.level = {
            row: row, //横行 x
            col: col //column 竖行 y
        }
        this.initCreate();
    },

    //==================事件处理================

    mousedown: function(event) {

        if(!this.gameIsStart) return

        //mouseup丢失处理
        if (this.isClick) {
            this.mouseup(event)
        }

        //如果动画还在运行
        if(this.isAminRun) return;
		this.isClick = true; //点击了屏幕
        this.$contentArea.css({
            'cursor': 'move'
        })

        this.element = $(event.target);

        //提供移动层级
		this.element.css({
			'z-index': '40'
		})

		this.orgLeft = parseInt(this.element.css('left'))
		this.orgTop  = parseInt(this.element.css('top'))

        this.start = {
			pageX : event.pageX,
			pageY : event.pageY,
			time  : (+new Date())
        }

        //得到点击的索引位
        this.startDebrisIndex = this.calculateOverlap(event.pageX, event.pageY, this.startDebrisIndex)
    },

    mousemove: function(event) {
    	if(!this.isClick) return
		var deltaX = event.pageX - this.start.pageX;
		var deltaY = event.pageY - this.start.pageY;
		//元素移动的距离
        this.element.css({
            'left' : deltaX + this.orgLeft + 'px',
            'top'  : deltaY +  this.orgTop + 'px'
        })
    },

    //松手
    mouseup: function(event) {
    	if(!this.isClick) return
    	this.isClick = false
        this.$contentArea.css({
            'cursor': 'pointer'
        })

        //拖动结束的索引位
        var endDebrisIndex = this.calculateOverlap(event.pageX, event.pageY, this.startDebrisIndex)

        this.isAminRun = true;

        //如果还在原区域
        if(this.startDebrisIndex === endDebrisIndex){
            //反弹,还原
            this.restorePosition(this.element);
        }else{
            //切换碎片图
            this.debrisExchange(this.startDebrisIndex,endDebrisIndex)
        }
      
    },

    //根据索引的位置计算出当前的行列排布
    calculateCR: function(index) {
        var levelCol = this.level.col;
        //判断正整数  
        var checkRate = function(value) {
            var re = /^[1-9]+[0-9]*]*$/;
            if (!re.test(value)) {
                return false;
            }
            return true
        }
        //计算行列
        var newLow, newRow;
        var colValue = index / levelCol;
        var integer = checkRate(colValue)
        if (integer) {
            newRow = colValue //正好整除的情况
        } else {
            newRow = Math.floor(colValue)
        }
        //列数
        newLow = Math.floor(index - (newRow * levelCol))
        return {
            row: newRow,
            low: newLow
        }

    },

    //切换碎片图
    debrisExchange: function(fromIndex, toIndex) {
        var self = this;

        // form的处理
        //列数
        var crFrom = this.calculateCR(toIndex)
        var newRowFrom = crFrom.row;
        var newLowFrom = crFrom.low;

        // to的处理
        var crTo =  this.calculateCR(fromIndex)
        var newRowTo = crTo.row;
        var newLowTo = crTo.low;


        //找到对应的元素
        var $fromElment = this.$debrisMap[fromIndex];
        var $toElement  = this.$debrisMap[toIndex]

        // 开始切换碎片图
        $fromElment.animate({
            'top'  : newRowFrom * this.debrisHeight + 'px',
            'left' : newLowFrom * this.debrisWidth + 'px'
        }, this.moveTime, function() {
            $fromElment.css('z-index', '10');
            complete();
        });

        $toElement.animate({
            'z-index' : 80,
            'top'     : newRowTo * this.debrisHeight + 'px',
            'left'    : newLowTo * this.debrisWidth + 'px'
        }, this.moveTime, function() {
            $toElement.css('z-index', '10');
            complete();
        });

     
        //切换动画完成后处理
        var completeNum = 2;
        function complete() {
            if (completeNum == 1) {
                //更新新的数据
                self.update(fromIndex, toIndex, $fromElment, $toElement);
                //检测是否成功
                self.checkSuccess();
                self.isAminRun = false
            }
            completeNum--;
        }
    },
    
    //更新内部映射索引数据
    update: function(fromIndex, toIndex, $fromElment, $toElement) {
        //更新快捷索引
        this.$debrisMap[fromIndex] = $toElement
        this.$debrisMap[toIndex]   = $fromElment

        // 更新随机索引
        var formeOrder = this.randomOrder[fromIndex]
        var toOrder    = this.randomOrder[toIndex]
        this.randomOrder.splice(toIndex,1,formeOrder)                                                                                                             
        this.randomOrder.splice(fromIndex,1,toOrder)
    },

    //检查是否成功
    checkSuccess: function() {
        //如果2个值相等，则排序正确
        if (this.originalOrder.toString() == this.randomOrder.toString()) {
            alert('成功')
            return true;
        }
        return false;
    },

    //反弹，还原位置
    restorePosition: function(element) {
        var self = this;
        element.animate({
            'top'  : this.orgTop + 'px',
            'left' : this.orgLeft + 'px'
        }, this.moveTime, function() {
            //动画结束后,恢复层级关系
            $(this).css('z-index', '10');
            self.isAminRun = false
        });
    },


    //计算交换元素
    //计算重叠区域
    //通过坐标判断
    calculateOverlap: function(pageX, pageY, startDebrisIndex) {

        var range = this.range;
        var absX = Math.abs(pageX);
        var absY = Math.abs(pageY);

        // if(startDebrisIndex){
        //     if( absX < range.left 
        //         || absX > range.right 
        //         || absY < range.top 
        //         || absY > range.bottom){
        //         return startDebrisIndex;
        //     }
        // }

        //根据当前移动的位置，与屏幕的每个碎片图比一下，得到当前的位置比
        var col = Math.floor((pageY - this.contentTop) / this.debrisWidth),
            row = Math.floor((pageX - this.contentLeft) / this.debrisHeight);

        //从整数1开始算起
        col = col + 1; //列
        row = row + 1; //行

        //索引位置
        //（上一列数 * 指定行）+ 当前行数
        var index = ( (col - 1) * this.level.col) + row

        return index - 1; //索引从0开始算
	},

    //绑定事件
    creatEvent: function() {
    	var self = this;
        this.$contentArea.mousedown(function(event) {
            self.mousedown(event)
        }).mousemove(function(event) {
            self.mousemove(event)
        }).mouseup(function(event) {
            self.mouseup(event)
        })
        return event;
    },

    //计算下随机布局排序
    calculateRandom: function() {
        //新是随机排序
        this.randomOrder = [];
        //计算随机
        var calculate = function(len) {
            return Math.floor(Math.random() * len);
        }
        for (var i = 0, len = this.originalOrder.length; i < len; i++) {
            var order = calculate(len);
            if (this.randomOrder.length > 0) {
                while (jQuery.inArray(order, this.randomOrder) > -1) {
                    order = calculate(len) //如果重复了，再次随机,直到每一个都唯一
                }
            }
            this.randomOrder.push(order);
        }
        return this.randomOrder;
    },

    //随机布局
    randomLayout: function(order) {
        this.cycleLayout(order, function(i) {
            return order[i];
        })
    },

    //复位布局
    restLayout: function(order) {
        this.cycleLayout(order, function(i) {
            return this.randomOrder.indexOf(i)
        })
    },

    //计算布局
    cycleLayout:function(order,callback){
        var newIndex, i = 0,
            tempMap = {}; //临时存储新的索引
        for (i, len = order.length; i < len; i++) {
            newIndex = callback.call(this,i);
            this.setLayout(i, newIndex)
            tempMap[i] = this.$debrisMap[newIndex]
        }
        //更新快速索引
        this.$debrisMap = tempMap;
    },

    //设置布局
    setLayout: function(i, index) {
        //获取到矩阵排列
        var cr = this.calculateCR(i)
        //变换新的位置
        this.$debrisMap[index].animate({
            'top'  : cr.row * this.debrisHeight + 'px',
            'left' : cr.low * this.debrisWidth + 'px'
        }, this.aminTime);
    }

}
