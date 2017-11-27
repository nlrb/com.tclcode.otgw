'use strict'

var accuracy = 2

function DecodeValue(val1, msgVal, val2) {
   var val = 0;
   if (msgVal == 'u16') { // unsigned 16
      val = val1*256 + val2;
   } else if (msgVal == 's16') { // signed 16
      val = val1*256 + val2;
      if (val1 & 0x80) {
         val = -65536 + val;
      }
   } else if (msgVal == 'f8.8') { // floating point
      val = val1 + val2/256;
      if (val1 & 0x80) {
         val = -256 + val;
      }
      if (accuracy !== undefined) {
        val =Number(val.toFixed(accuracy))
      }
   } else { // byte only types
		if (msgVal == 'flag8') { // flag 8
			for (let i = 7; i >= 0; i--) {
				val += (val1 & Math.pow(2, i)) ? '1' : '0';
			}
		} else if (msgVal == 'u8') { // unsigned 8
			 val = val1;
		} else if (msgVal == 's8') { // signed 8
			 val = val1;
			 if (val1 & 0x80) {
				val = -256 + val;
			 }
		}
		if (val2 != null) {
			val = val + ' ' + DecodeValue(val2, msgVal);
		}
	}

	return val
}

function setFloatDigits(nr) {
  if (nr >= 0) {
    accuracy = nr
  } else {
    accuarcy = undefined
  }
}

var debugLevel = 1;

// Debug logging
function debug() {
  let level = arguments[0];
	if (level & debugLevel) {
		var now = new Date();
		var itemdebug = (x) => {
			var t = Object.prototype.toString.call(x);
			return (t === '[object Object]' ? JSON.stringify(x, null, 3) : (typeof x === 'object' ? JSON.stringify(x) : x)) + ' '
		};
		var time = now.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
		var ms = ('00' + now.getMilliseconds()).slice(-3);
		var text = '';
		for (var i = 1; i < arguments.length; i++) {
			var x = arguments[i];
			if (Object.prototype.toString.call(arguments[i]) === '[object Arguments]') {
				for (var j = 0; j < x.length; j++) {
					text += itemdebug(x[j]);
				}
			} else {
				text += itemdebug(x);
			}
		}
    text = text.slice(0, -1);
		time += '.' + ms;
		return { time: time, msg: text}
	}
}

function setDebug(level) {
  if (level !== undefined) {
    debugLevel = level
  }
}

module.exports = {
  decode: DecodeValue,
  setDigits: setFloatDigits,
  debug: debug,
  setDebug: setDebug
}
