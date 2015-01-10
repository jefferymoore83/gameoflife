/*
Conway's Game of Life written in vanilla JS, revealing prototype pattern
by Jeffery Moore and Brandon Foster

TODO:

-create default option object that gets merged with passed values
-ability to speed up and slow down easily, dynamically even
-a bar that lets you seek to different points in time
-want to write results to files if possible
-draw vectors so they could later be custom shapes

references:
http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life#Algorithms
http://processingjs.org/learning/topic/conway/
http://natureofcode.com/book/chapter-7-cellular-automata/
*/

var Life = function(config) {
    "use strict";
    
    if (config) {
        this.config = config;
    }
    this.btn_start = config.btn_start;
    this.btn_stop = config.btn_stop;
    this.btn_stop.style.display = 'none';

    //why doesn't this work??
    // this.btn_start.onclick = function() {
    //     this.start();
    // };
    // this.btn_stop.onclick = function() {
    //     this.stop();
    // };    
};

Life.prototype = function() {
    "use strict";

    var
    self,
    ctx,
    canvas,
    fps_gauge,
    timestamp_now = function() { return new Date().getTime(); },

    stage = {
        width: function() { return document.documentElement.clientWidth; },
        height: function() { return document.documentElement.clientHeight; }
    },

    //could there be different types of life, represented by different colors, with different life/death rules?
    seed = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,1,0,1,0,0,0,0,0,0],
        [0,0,0,0,1,1,1,0,0,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,0,0,0,0,1,0,0,0,0,1]
    ],
    bitmap = seed,

    timescale = 10,  //for example, 1 means one rule application cycle per frame.  must be an integer gte 1, higher number means slower growth
    pixelscalex = 10, //for example, 10 means each column measures 10 pixels in width. must be an integer 
    pixelscaley = 10, //for example, 10 means each row measures 10 pixels in height. must be an integer 

    frame_count = 0,
    frame_last_rendered = -timescale,
    animation_id = false,
    animation_last_run = timestamp_now(),

    fps = 0,
    fps_update_limit = 100,
    fps_last_update = timestamp_now(),

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
            //debug.log('surround_counted: ',living);
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
            for ( var y=0; y < canvas.height; y++ ) {
                for ( var x=0; x < canvas.width; x++ ) {
                    newframe[y][x] = rules.check_all( bitmap, x, y, rules.surround_count( bitmap, x, y ) ) ? 1 : 0;
                }
            }
            return newframe;
        },

        //John Conway's ruleset
        ruleset: [
            //if no living squares surround a living square, it dies of loneliness
            function( status, count ) {
                return ( status && ( count === 0 ) );  
            },
            //if a living square is surrounded 3 or more other living squares, it dies of overcrowding
            function( status, count ) {
                return ( status && ( count < 3 ) );  
            },
            //if a dead square is surrounded by 3 living squares, it's born
            function( status, count ) {
                return ( status || ( !status && ( count >= 3 ) ) );  
            }
        ]

    },

    render_frame = function( canvas, bitmap ) {
        //do not apply rules or redraw if not enough frames have passed to satisfy timescale
        if ( frame_count >= ( frame_last_rendered + timescale ) ) {
            ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );

            bitmap = rules.apply( bitmap );

            for ( var y=0; y < canvas.height; y++ ) {
                for ( var x=0; x < canvas.width; x++ ) {
                    if ( rules.alive( bitmap, x, y ) ) {
                       ctx.fillRect( x * pixelscalex, y * pixelscaley, pixelscalex, pixelscaley );
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
        for ( var y=0; y < canvas.height; y++ ) {
            for ( var x=0; x < canvas.width; x++ ) {
                if ( !bitmap[y] ) { bitmap[y] = new Array(canvas.width); }
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
        self = this;
        if (animation_id === false) {
            debug.log('timescale is '+timescale+', so a change will be rendered every '+timescale+' frames');
            if (this.btn_start && this.btn_stop) {
                element_show(this.btn_stop);
                element_hide(this.btn_start);
            }
            canvas = get_canvas();
            fps_gauge = get_fps_gauge();
            element_show(fps_gauge);
            animation_id = requestAnimationFrame( on_next_frame ); 

            window.onresize = function() {
                canvas.width = stage.width();
                canvas.height = stage.height();
            };
            window.onresize();
        }
    },

    animation_stop = function() {
        if (this.btn_start && this.btn_stop) {
            element_show(this.btn_start);
            element_hide(this.btn_stop);
        }
        if (animation_id !== false) {
            cancelAnimationFrame( animation_id );
            animation_id = false;
            element_hide(fps_gauge);
            //element_remove(fps_gauge);
            debug.log('anim stopped');
            window.onresize = null;
        }
    },

    get_canvas = function() {
        var canvas = document.querySelectorAll('canvas.life-canvas');
        if (canvas.length > 0) {
            canvas = canvas[0];
        } else {
            canvas = document.createElement('canvas');
            canvas.className = 'life-canvas';
            document.querySelector('body').appendChild( canvas );
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
            if (!self.config.debug) { return; }

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
        start: animation_start,
        stop: animation_stop
    };

} ();