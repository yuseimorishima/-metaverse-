import { createGameHub } from './game-core.js?v=5';
const PREFIX='neon-tag-v4-school-';
// Same interface as the WebSocket transport so both modes use the same UI and rules.
export class PeerTransport extends EventTarget {
  readyState=0;
  constructor(options={}){
    super();this.options=options;this.clients=new Set();this.code=[...crypto.getRandomValues(new Uint8Array(3))].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
    this.peer=new window.Peer(PREFIX+this.code,options);
    if(options.debug)window.debugPeerTransport=this;
    this.connectionTimer=setTimeout(()=>this.fail('接続の仲介サービスにつながりません。通信環境を確認して再読み込みしてください'),20000);
    this.peer.on('open',()=>{clearTimeout(this.connectionTimer);this.readyState=1;this.dispatchEvent(new Event('open'));});
    this.peer.on('connection',conn=>this.accept(conn));
    this.peer.on('error',error=>{
      if(error.type==='peer-unavailable'){clearTimeout(this.joinTimer);this.joining?.close();this.joining=null;this.deliver({type:'error',message:'ルームが見つかりません。コードとホストの接続を確認してください'});return;}
      this.fail('通信エラーが発生しました。ページを再読み込みしてください（'+error.type+'）');
    });
    this.peer.on('disconnected',()=>{if(!this.closed&&!this.peer.destroyed)setTimeout(()=>{if(!this.closed&&!this.peer.destroyed)this.peer.reconnect();},2000);});
  }
  deliver(data){this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(data)}));}
  fail(message){if(this.closed)return;this.deliver({type:'error',message});this.dispatchEvent(new Event('error'));this.close();}
  send(raw){
    let m;try{m=JSON.parse(raw);}catch{return;}
    if(m.type==='create'){
      if(this.local?.room||this.guest||this.joining)return;
      this.hub=createGameHub({makeCode:()=>this.code,send:(client,data)=>client===this.local?this.deliver(data):client.conn.open&&client.conn.send(data)});
      this.local={};this.hub.message(this.local,m);
      this.hub.tick();
      this.tick=setInterval(()=>this.hub?.tick(),1000/30);return;
    }
    if(m.type==='join'){
      if(this.local?.room||this.guest||this.joining)return;
      const code=String(m.code||'').trim().toUpperCase();if(!/^[0-9A-F]{6}$/.test(code)){this.deliver({type:'error',message:'6文字のルームコードを確認してください'});return;}
      const conn=this.peer.connect(PREFIX+code,{reliable:true});this.joining=conn;let joined=false,lastReceived=Date.now();
      const lost=()=>{clearTimeout(this.joinTimer);clearInterval(watchdog);if(this.guest===conn){this.guest=null;this.deliver({type:'left'});this.deliver({type:'error',message:'ホストとの接続が終了しました。新しい部屋に参加してください'});}if(this.joining===conn)this.joining=null;};
      const watchdog=setInterval(()=>{if(joined&&Date.now()-lastReceived>10000){lost();conn.close();}},1000);this.guestWatchdog=watchdog;
      this.joinTimer=setTimeout(()=>{if(!joined){this.joining=null;conn.close();this.deliver({type:'error',message:'部屋につながりません。ホストの接続や別のWi-Fiで試してください'});}},20000);
      conn.on('open',()=>conn.send({type:'join',name:m.name,code}));
      conn.on('data',data=>{lastReceived=Date.now();if(data?.type==='host-left'){lost();conn.close();return;}if(!data||typeof data!=='object')return;if(data.type==='welcome'){joined=true;clearTimeout(this.joinTimer);this.guest=conn;this.joining=null;}
        if(data.type==='error'&&!joined){clearTimeout(this.joinTimer);this.joining=null;conn.close();}
        this.deliver(data);
      });
      conn.on('close',lost);
      conn.on('error',()=>{if(this.joining===conn){clearTimeout(this.joinTimer);this.joining=null;this.deliver({type:'error',message:'ルームへの接続に失敗しました'});}});return;
    }
    if(m.type==='leave'){
      if(this.hub){clearInterval(this.tick);this.hub=null;this.local=null;for(const c of this.clients){if(c.conn.open)c.conn.send({type:'host-left'});setTimeout(()=>c.conn.close(),150);}this.clients.clear();}
      if(this.guest){const conn=this.guest;this.guest=null;conn.send(m);conn.close();}
      this.deliver({type:'left'});return;
    }
    if(this.hub)this.hub.message(this.local,m);else if(this.guest?.open)this.guest.send(m);
  }
  accept(conn){
    if(!this.hub){conn.on('open',()=>{conn.send({type:'error',message:'ホストが部屋を開いていません'});setTimeout(()=>conn.close(),200);});return;}
    const client={conn};this.clients.add(client);let start=Date.now(),count=0;
    const timeout=setTimeout(()=>{if(!client.room)conn.close();},10000);
    conn.on('data',m=>{if(!this.hub)return;if(Date.now()-start>1000){start=Date.now();count=0;}if(++count>100||!m||typeof m!=='object'||JSON.stringify(m).length>2048){conn.close();return;}
      if(!client.room){if(m.type!=='join')return;clearTimeout(timeout);this.hub.message(client,{...m,code:this.code});return;}
      if(['input','tap','start','leave'].includes(m.type))this.hub.message(client,m);
    });
    const cleanup=()=>{clearTimeout(timeout);this.hub?.leave(client);this.clients.delete(client);};conn.on('close',cleanup);conn.on('error',cleanup);
  }
  close(){if(this.closed)return;this.closed=true;this.readyState=3;clearInterval(this.tick);clearInterval(this.guestWatchdog);clearTimeout(this.connectionTimer);clearTimeout(this.joinTimer);this.peer.destroy();this.hub=null;this.clients.clear();this.dispatchEvent(new Event('close'));}
}
