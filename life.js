/*
Conway's Game of Life written in vanilla JS, revealing prototype pattern
by Jeffery Moore and Brandon Foster

TODO:

-render first frame on init
-ability to speed up and slow down easily, dynamically even
-a bar that lets you seek to different points in time
-want to write results to files if possible
-draw vectors so they could later be custom shapes
-could there be different types of life, represented by different colors, with different life/death rules?

references:
http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life#Algorithms
http://processingjs.org/learning/topic/conway/
http://natureofcode.com/book/chapter-7-cellular-automata/
*/

var Life = function(config) {
    "use strict";
    this.init( config || {} ); 
};

Life.prototype = function() {
    "use strict";

    var
    ctx, canvas, bitmap, fps_gauge, fps_last_update, animation_id, animation_last_run, frame_count, frame_last_rendered,
    fps = 0, fps_update_limit = 100,

    config = {
        debug: false,
        controls: true,
        fullscreen: true,
        stage: [ 800,600 ],
        selector: 'body',
        timescale: 1,  //for example, 1 means 1 cycle per frame.  must be an integer gte 1, the higher, the slower
        cellsize: 2, //for example, 10 means each pixel measures 10 pixels in width/height
        random_seed: .525,
        seed : [
            /*
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0],
            [0,0,0,1,0,1,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,0],
            [0,0,1,0,1,0,0,0,0,0],
            [0,0,1,1,0,1,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0]
            */
            [1,0,1,0,1,0,1,0,1,0,1,0],
            [0,1,0,1,0,1,0,1,0,1,0,1],
            [1,0,1,0,1,0,1,0,1,0,1,0],
            [0,1,0,1,0,1,0,1,0,1,0,1],
            [1,0,1,0,1,0,1,0,1,0,1,0],
            [0,1,0,1,0,1,0,1,0,1,0,1],
            [1,0,1,0,1,0,1,0,1,0,1,0],
            [0,1,0,1,0,1,0,1,0,1,0,1],
            [1,0,1,0,1,0,1,0,1,0,1,0],
            [0,1,0,1,0,1,0,1,0,1,0,1]
        ]
    },

    init = function(cfg) {        
        config = merge_objects( config, cfg );
        bitmap = config.random_seed ? generate_random_seed( config.random_seed ) : config.seed;
        canvas = get_canvas();
        animation_id = false;
        animation_last_run = timestamp_now();
        fps_last_update = timestamp_now();
        frame_count = 0;
        frame_last_rendered = -config.timescale;

        if (config.fullscreen) {
            window.onresize = function() {
                canvas.width = stage.width();
                canvas.height = stage.height();
            };
            window.onresize();
        } else {
            canvas.width = config.stage[0];
            canvas.height = config.stage[1];
        }
        
        if ( config.btn_start && config.btn_stop ) {
            config.btn_start.onclick = animation_start;
            config.btn_stop.onclick = animation_stop;
            element_hide( config.btn_stop );
        }
    },

    stage = {
        width: function() { return config.fullscreen ? window.innerWidth : canvas.width; },
        height: function() { return config.fullscreen ? window.innerHeight : canvas.height; }
    },

    generate_random_seed = function(bias) {
        var seed = fill_out_bitmap([]),
            bias = bias ? bias : 1;

        for ( var y=0; y < stage.height(); y++ ) {
            for ( var x=0; x < stage.width(); x++ ) {
                seed[y][x] = Math.round( Math.random() * bias );
            }
        }
        return seed;
    },

    rules = {
        alive: function( bitmap, x, y ) {
            var alive = ( bitmap[y] && bitmap[y][x] && ( bitmap[y][x] === 1 ) );
            /*
            if (alive) {
                ctx.fillStyle = "green";
            }
            */
            return alive;
        },

        alive_offset: function( bitmap, x, y, offsetx, offsety ) {
            return this.alive( bitmap, x + offsetx, y + offsety );
        },
        
        surround_count: function( bitmap, x, y ) {
            var living = 0,
                vicinity = [
                    this.alive_offset( bitmap, x, y, -1, -1 ),
                    this.alive_offset( bitmap, x, y,  0, -1 ),
                    this.alive_offset( bitmap, x, y,  1, -1 ),
                    this.alive_offset( bitmap, x, y,  1,  0 ),
                    this.alive_offset( bitmap, x, y,  1,  1 ),
                    this.alive_offset( bitmap, x, y,  0,  1 ),
                    this.alive_offset( bitmap, x, y, -1,  1 ),
                    this.alive_offset( bitmap, x, y, -1,  0 )
                ];
            for (var i=0; i < vicinity.length; i++) {
                if ( vicinity[i] ) {
                    living++;
                }
            }
            return living;
        },

        check_all: function( bitmap, x, y, count ) {
            var rules  = this.ruleset,
                status = this.alive( bitmap, x, y );

            for(var i=0; i < rules.length; i++) {
                if ( !rules[i]( status, count ) ) {
                    return false;
                }
            }
            return true;
        },

        apply: function( bitmap, x, y ) {
            var newframe = fill_out_bitmap( bitmap );
            for ( var y=0; y < stage.height(); y++ ) {
                for ( var x=0; x < stage.width(); x++ ) {
                    newframe[y][x] = rules.check_all( bitmap, x, y, rules.surround_count( bitmap, x, y ) ) ? 1 : 0;
                }
            }
            return newframe;
        },

        //John Conway's ruleset
        //all these must return true to maintain or birth a square. otherwise the square dies or stays dead
        ruleset: [
            //if no living squares surround a living square, it dies of loneliness
            function( status, count ) {
                return ( !status || ( status && ( count > 0 ) ) );  
            },
            //if a living square is surrounded 3 or more other living squares, it dies of overcrowding
            function( status, count ) {
                return ( !status || ( status && ( count < 3 ) ) );  
            },
            //if a dead square is surrounded by 3 living squares, it's born
            function( status, count ) {
                return ( status || ( !status && ( count >= 3 ) ) );  
            }
        ]

    },

    render_frame = function( canvas, bitmap ) {
        //do not apply rules or redraw if not enough frames have passed to satisfy timescale
        if ( frame_count >= ( frame_last_rendered + config.timescale ) ) {
            ctx.clearRect ( 0 , 0 , stage.width(), stage.height() );

            bitmap = rules.apply( bitmap );

            for ( var y=0; y < stage.height(); y++ ) {
                for ( var x=0; x < stage.width(); x++ ) {
                    if ( rules.alive( bitmap, x, y ) ) {
                       ctx.fillRect( x * config.cellsize, y * config.cellsize, config.cellsize, config.cellsize );
                    }
                }
            }
            frame_last_rendered = frame_count;
            debug.log('rendered frame change');
        }
        frame_count++;
    },

    fill_out_bitmap = function( bitmap ) {
        //ensure our bitmap has all the pixels it needs
        for ( var y=0; y < stage.height(); y++ ) {
            for ( var x=0; x < stage.width(); x++ ) {
                if ( !bitmap[y] ) { bitmap[y] = new Array( stage.width() ); }
                if ( !bitmap[y][x] ) { bitmap[y][x] = 0; }
            }
        }
        return bitmap;
    },

    on_next_frame = function() {
        render_frame( canvas, bitmap );
        fps_update();
        animation_last_run = timestamp_now();
        animation_id = requestAnimationFrame( on_next_frame );
    },

    animation_start = function() {
        if (animation_id === false) {
            debug.log('timescale is '+config.timescale+', so a change will be rendered every '+config.timescale+' frames');
            
            if (config.btn_start && config.btn_stop) {
                element_show(config.btn_stop);
                element_hide(config.btn_start);
            }
            fps_gauge = get_fps_gauge();
            element_show(fps_gauge);
            animation_id = requestAnimationFrame( on_next_frame ); 
        }
    },

    animation_stop = function() {
        if (animation_id !== false) {
            if (config.btn_start && config.btn_stop) {
                element_show(config.btn_start);
                element_hide(config.btn_stop);
            }
            cancelAnimationFrame( animation_id );
            animation_id = false;
            element_hide(fps_gauge);
            debug.log('anim stopped');
            if (config.fullscreen) {
                window.onresize = null;
            }
        }
    },

    get_canvas = function() {
        var canvas = document.querySelectorAll('canvas.life-canvas');
        if (canvas.length > 0) {
            canvas = canvas[0];
        } else {
            canvas = document.createElement('canvas');
            canvas.className = 'life-canvas';
            document.querySelector( config.selector ).appendChild( canvas );

            if (config.controls) {
                var controls = document.createElement('div');
                insert_after(canvas, controls);
                controls.className = 'life-controls';
                controls.innerHTML = '<button class="btn-start">Start</button> <button class="btn-stop">Stop</button>';
                config.btn_start = document.querySelectorAll('.life-controls .btn-start')[0];
                config.btn_stop = document.querySelectorAll('.life-controls .btn-stop')[0];

                //controls.innerHTML += '<input class="range-cellsize" type="range" min="1" max="50" step="1" value="' + config.cellsize + '" />';
                // var range_cellsize = document.querySelectorAll('.life-controls .range-cellsize')[0];
                // range_cellsize.onchange = function() {
                //     debug.log('set cellsize to ' + config.cellsize);
                //     config.cellsize = this.value;
                // };
            }
        }
        ctx = canvas.getContext( "2d" );
        return canvas;
    },

    get_fps_gauge = function() {
        var gauge = document.querySelectorAll('.life-fps-gauge');
        if (gauge.length > 0) {
            return gauge[0];
        } else {
            return insert_after(canvas, document.createElement('div'), 'life-fps-gauge');
        }
    },

    fps_update = function() {
        var now = timestamp_now();
        fps = 1 / ( ( now - animation_last_run ) / 1000 );
        if ( ( now - fps_last_update ) >= fps_update_limit ) {
            fps_gauge.innerHTML =  Math.floor( fps ) + ' fps';
            fps_last_update = now;
        }
    },

    debug = {
        log: function() {
            if (!config.debug) { return; }

            var args = Array.prototype.slice.call(arguments);
            if (window.console) {
                if (console.log.apply) {
                    console.log.apply(console, args);
                } else {
                    // Some browsers don't support .apply() for console.log, so just pass an array
                    console.log(args);
                }
            }
        }
    },

    merge_objects = function(obj1, obj2) {
        for( var key in obj2 ) {
            if ( obj2.hasOwnProperty( key ) ) {
                obj1[key] = obj2[key];
            }
        }
        return obj1;
    },

    timestamp_now = function() { return new Date().getTime(); },

    insert_after = function(refNode, newNode, className) {
        refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
        if (className) {
            newNode.className = className;
        }
        return newNode;
    },

    element_remove = function(child) {
        child.parentNode.removeChild(child);
    },

    element_hide = function(ele) {
        ele.style.display = 'none';
        return ele;
    },

    element_show = function(ele) {
        ele.style.display = 'block';
        return ele;
    };

    return {
        init: init,
        config: config,
        start: animation_start,
        stop: animation_stop
    };

} ();