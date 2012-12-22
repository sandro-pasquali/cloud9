"use strict";

var util = require("util");

var Plugin = require("../cloud9.core/plugin");

var pty = require("pty.js");

var name = "terminal";
var ProcessManager;
var EventBus;

module.exports = function setup(options, imports, register) {
    ProcessManager = imports["process-manager"];
    EventBus = imports.eventbus;
    imports.ide.register(name, TerminalPlugin, register);
};

var TerminalPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    this.pm = ProcessManager;
    this.eventbus = EventBus;
    this.workspaceId = workspace.workspaceId;
    this.channel = this.workspaceId + "::terminal";

    this.hooks = ["command"];
    this.name = "terminal";

    this.gitEnv = {
        GIT_ASKPASS: "/bin/echo",
        EDITOR: "",
        GIT_EDITOR: ""
    };
    this.ptys= {};
    this.processCount = 0;
};

util.inherits(TerminalPlugin, Plugin);

(function() {
    
    this.init = function() {
        var self = this;
        this.eventbus.on(this.channel, function(msg) {
            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
    };
    
    this.command = function (user, message, client) {
        var _self = this;
        var msg = message;
        var cmd = message.command ? message.command : "";
        /* sendable commands
            "ttyCallback"
            "ttyData"
            "ttyGone"
            "ttyResize"
        */
        
        switch(cmd){
            case "ttyCreate":
                break;
            case "ttyResize":
                break;
            case "ttyKill":
                break;
            case "ttyPing":
                break;
            case "ttyData":
                break;
            default://not one of our commands!!!
                return false;
        }

        console.log(message);
        //doo stuff
        var term;
        
        if(cmd == "ttyCreate"){
            term = pty.spawn("ssh", ["bmatusiak@dev.shcdn.biz"], {
                name: 'xterm-color',
                cols: 80,
                rows: 24
            });
            
            _self.ptys[term.fd] = term;
            
            client.send({
                    command:"ttyCallback",
                    fd:term.fd,
                    reqId:message.reqId
                });
            
            term.on("data", function(data) {
                client.send({
                    command:"ttyData",
                    fd:term.fd,
                    data:data
                });
            });
        }
        if(cmd == "ttyData"){
            if(_self.ptys[msg.fd]){
                term = _self.ptys[msg.fd];
                
                term.write(msg.data);
            }
        }

        return true;
    };

    this.canShutdown = function() {
        return true;
    };

}).call(TerminalPlugin.prototype);