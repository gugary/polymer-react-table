(function(){
    function go(el){
        var mycols = [
            {name:'t', disp:'Symbol', klass:'symbol', type:'ticker'},
            {name:'e', disp:'Exchange', klass:'exchange', type:'string'},
            {name:'l', disp:'Last Price', klass:'price', type:'string'},
            {name:'c', disp:'Change', klass:'change', type:'change'},
            {name:'cp', disp:'% Change', klass:'pctchg', type:'pctchg'},
            {name:'lt_dts', disp:'Last Traded', klass:'datetime', type:'datetime'},
        ]
        function scoped(props){
            var ss = "style-scope " + el.is;
            if(props.className){
                props.className = ss + " " + props.className;
            }else{
                props.className = ss;
            }
            return props;
        }
        function cellByType(type,v,r){
            if(type==='change'){
                return mkElem('span', scoped({className:v[0]==='+'?"up":"down"}), v);
            }else if(type==='pctchg'){
                return mkElem('span', scoped({className:v>0?"up":"down"}), v+"%");
            }else if(type==='datetime'){
                return v.replace("T"," ").replace("Z","");
            }else if(type==='ticker'){
                return mkElem('a', scoped({href:"https://www.google.com/finance?q="+r.e+":"+v, target:"_blank"}), v);
            }else{
                return v;
            }
        }
        function mkComp(spec){
            return React.createClass(spec);
        }
        function mkElem(tag,props,children){
            return React.createElement(tag,props,children);
        }
        var th = mkComp({
            render: function(){
                return mkElem('th', scoped({className:"gth"}), this.props.val);
            }
        });
        var thead = mkComp({
            render: function(){
                return mkElem(
                    'thead', scoped({}),
                    mkElem("tr", scoped({}), this.props.cols.map(function(c,j){
                        return mkElem(th, {key:j, val:c.disp})
                    }))
                )
            }
        });
        var td = mkComp({
            render: function(){
                var c=this.props.col, v=this.props.val, r=this.props.row;
                return mkElem('td', scoped({className:c.klass}), cellByType(c.type,v,r));
            }
        });
        var tr = mkComp({
            render: function(){
                var myrow=this.props.row;
                return mkElem("tr", scoped({}), this.props.cols.map(function(c,j){
                    return mkElem(td, {key:j, val:myrow[c.name], col:c, row:myrow});
                }));
            }
        });
        var tbody = mkComp({
            render: function(){
                var mycols=this.props.cols;
                return mkElem('tbody', scoped({}), this.props.rows.map(function(r,j){
                    return mkElem(tr, {key:j, row:r, cols:mycols});
                }));
            }
        });
        var nyse_holidays=["2016/11/24","2016/12/26","2017/01/02","2017/01/16","2017/02/20","2017/04/14","2017/05/29","2017/07/04","2017/09/04","2017/11/23","2017/12/25"];
        var holidays = nyse_holidays.map(function(d){
            var p=d.split('/');
            var d=new Date(p[0],p[1]-1,p[2]);
            return d.toDateString();
        });
        function isWeekend(d){
            var name = d.substr(0,3);
            return name==='Sat' || name==='Sun';
        }
        function isTradingDay(d){
            return !isWeekend(d) && !isHoliday(d);
        }
        function isHoliday(d){
            return holidays.indexOf(d)>=0;
        }
        function isTradingHour(){
            var d=new Date(),h=d.getUTCHours();
	    var open=isTradingDay(d.toDateString());
            return open && h<20 && (h>13 || (h==13 && 30<=d.getMinutes()));
        }
        var table = mkComp({
            getInitialState: function(){
                return {rows:[]}
            },
            onTimer: function(){
                if(isTradingHour()){
                    this.googleApi();
                }
            },
            googleApi: function(){
                $.ajax({
                    url: this.props.url,
                    dataType: 'json',
                    cache: false,
                    success: function(json){
                        this.setState({rows:json})
                    }.bind(this),
                    error: function(xhr, status, err){
                        console.error(status, err.toString());
                    }
                });
            },
            componentDidMount: function() {
                this.googleApi();
                setInterval(this.onTimer, 1000);
            },
            render: function(){
                var mycols=this.props.cols;
                return mkElem('table', scoped({}),[
                    mkElem(thead, {key:0, cols:mycols}),
                    mkElem(tbody, {key:1, cols:mycols, rows:this.state.rows})
                ])
            }
        });
        ReactDOM.render(
            mkElem(table, {url:el.url, cols:mycols}),
            document.getElementById('gug')
        );
    }
    Polymer({
        is : "g4-stocks",
        properties:{
            id:{
                type: String
            },
            url:{
                type: String,
                value: null
            }
        },
        ready: function(){
            go(this);
        }
    });
})();
