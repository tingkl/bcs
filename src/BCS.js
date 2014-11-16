/**
 * Created by dingguoliang01 on 2014/11/16.
 */
define(['sha1', 'uuid'], function(sha1, generator) {
    var defaultConfig = {
        'ak': 'ak',
        'sk': 'sk',
        'MBO': 'MBO',
        'Bucket': 'Bucket',
        'Method': 'Method',
        'Host': 'Host',
        'Object': ''
    };
    function BCS(blob) {
        var name = blob.name;
        var index = name.lastIndexOf('.');
        var suffix = '';
        if (index > -1) {
            suffix = name.substring(index);
            suffix = suffix.replace(/[^a-zA-Z\.\d]/g, '');
        }
        var uuid = generator.uuid(16, 10) + suffix;
        this._config = {
            'ak': defaultConfig['ak'],
            'sk': defaultConfig['sk'],
            'MBO': defaultConfig['MBO'],
            'Bucket': defaultConfig['Bucket'],
            'Method': defaultConfig['Method'],
            'Blob': blob,
            'Host': defaultConfig['Host'],
            'Object': '/' + uuid
        };
        this._listeners = {};
    }
    BCS.config = function(key, value) {
        defaultConfig[key] = value;
        return BCS;
    }
    BCS.setConfig = function(config) {
        for (var key in config) {
            BCS.config(key, config[key]);
        }
        return BCS;
    }
    BCS.evt = {
        'ERROR': 'error',
        'ABORT': 'abort',
        'LOAD': 'load',
        'PROGRESS': 'progress'
    };
    BCS.prototype.config = function(key, value) {
        this._config[key] = value;
        return this;
    }
    BCS.prototype.setConfig = function(config) {
        for (var key in config) {
            this._config[key] = config[key];
        }
        return this;
    }
    BCS.prototype.abort = function() {
        this._xhr.abort();
        return this;
    }
    BCS.prototype.getURL = function() {
        var config = this._config;
        var Content= [config.MBO, "Method=" + config.Method, "Bucket=" + encodeURIComponent(config.Bucket), "Object=" + config.Object, ""].join("\n");
        var step1 = sha1.b64_hmac_sha1(config.sk, Content);
        var step2 = encodeURIComponent(step1 + "=").replace(/%2F/g, '/');
        return [config.Host, config.Bucket, config.Object, '?sign=', config.MBO, ':', config.ak, ':',
            step2].join('');
    }
    BCS.prototype.addListener = function(type, listener) {
        if (type in this._listeners) {
            this._listeners[type].push[listener];
        }
        else {
            this._listeners[type] = [listener];
        }
        return this;
    }
    BCS.prototype._addListener = function (type) {
        var me = this;
        var aim;
        if (type === BCS.evt.progress) {
            aim = this._xhr.upload;
        }
        else {
            aim = this._xhr;
        }
        var target = this._listeners[type];
        if (target && target.length > 0) {
            aim.addEventListener(type, function(evt) {
                for (var i = 0, l = target.length; i < l; i++) {
                    target[i].call(me, evt);
                }
            }, false);
        }
    }
    BCS.prototype.upload = function() {
        // XMLHttpRequest 对象
        var xhr = new XMLHttpRequest();
        this._xhr = xhr;
        xhr.open(this._config.Method, this.getURL(), true);
        this._addListener(BCS.evt.PROGRESS);
        this._addListener(BCS.evt.LOAD);
        this._addListener(BCS.evt.ERROR);
        this._addListener(BCS.evt.ABORT);
        var method = this._config.Method;
        if (method === 'POST') {
            var form = new FormData();
            form.append("whatever", this._config.Blob);
            xhr.send(form);
        }
        else if (method === 'PUT') {
            xhr.send(this._config.Blob);
        }
        return this;
    }
    return BCS;
});