(function() {

var
apply_rules = function( bitmap, x, y ) {
    //what will these be? maybe standardize a way of creating different rulesets
    return bitmap;
},
render_frame = function( canvas, bitmap ) {
    //manipulate canvas here from current state of bitmap
},
create_canvas = function() {
    var canvas = document.createElement('canvas');
    document.querySelector('body').appendChild( canvas );
    return canvas;
},
init = function() {
    var
    seed = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    stage = {
        width: 800,
        height: 600
    },
    bitmap = [],
    bitmap = seed,
    canvas = create_canvas();

    for ( var y=0; y < stage.height; y++ ) {

        for ( var x=0; x < stage.width; x++ ) {

            render_frame( canvas, apply_rules( bitmap, x, y ) );

        }

    }
};

init();

})();