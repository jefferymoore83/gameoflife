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
    canvas,
    fps_gauge,
    timestamp_now = function() { return new Date().getTime(); },

    stage = {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
    },

    //could there be different types of life, represented by different colors, with different life/death rules?
    seed = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    bitmap = seed,

    timescale = 1,  //for example, 1 means one rule application cycle per frame.  must be an integer gte 1
    pixelscalex = 10, //for example, 10 means each column measures 10 pixels in width. must be an integer 
    pixelscaley = 10, //for example, 10 means each row measures 10 pixels in height. must be an integer 

    animation_id = false,
    animation_last_run = timestamp_now(),

    fps = 0,
    fps_update_limit = 100,
    fps_last_update = timestamp_now(),
    
    apply_rules = function( bitmap, x, y ) {
        //what will these be? maybe standardize a way of creating different rulesets
        return bitmap;
    },

    render_frame = function( canvas, bitmap ) {
        //do not apply rules or redraw if not enough frames have passed to satisfy timescale
        for ( var y=0; y < stage.height; y++ ) {
            for ( var x=0; x < stage.width; x++ ) {
                apply_rules( bitmap, x, y );
            }
        }
        //manipulate canvas here, using current state of bitmap
        //use pixelscalex and pixelscaley
        debug.log('frame rendered');
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
            if (this.btn_start && this.btn_stop) {
                element_show(this.btn_stop);
                element_hide(this.btn_start);
            }
            canvas = get_canvas();
            fps_gauge = get_fps_gauge();
            element_show(fps_gauge);
            animation_id = requestAnimationFrame( on_next_frame ); 
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
        canvas.style.width = stage.width + 'px';
        canvas.style.height = stage.height + 'px';
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