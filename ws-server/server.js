const WebSocket=require("ws");const mysql=require("mysql");const http=require("http");const os=require("os");const fs=require("fs");const path=require("path");const crypto=require("crypto");function v(){const l=path.join(__dirname,'../license.key');const h=path.join(__dirname,'../.license_hash');if(!fs.existsSync(l)){console.error('❌ FATAL: License file not found.');process.exit(1);}if(!fs.existsSync(h)){console.error('❌ FATAL: License integrity file missing.');process.exit(1);}const sh=fs.readFileSync(h,'utf8').trim();const fc=fs.readFileSync(l,'utf8');const ch=crypto.createHash('sha256').update(fc).digest('hex');if(sh!==ch){console.error('❌ FATAL: License file integrity check failed.');process.exit(1);}try{const lic=JSON.parse(fc);const ed=new Date(lic.data.expires);if(new Date()>ed){console.error('❌ FATAL: License has expired.');process.exit(1);}console.log('✅ License validated');return true;}catch(e){console.error('❌ FATAL: Invalid license format.');process.exit(1);}}v();function getLocalIPAddress(){const interfaces=os.networkInterfaces();for(const name of Object.keys(interfaces)){for(const iface of interfaces[name]){if(iface.family==='IPv4'&&!iface.internal){return iface.address;}}}return '0.0.0.0';}const db=mysql.createPool({host:"localhost",user:"root",password:"root",database:"tabdb",waitForConnections:true,connectionLimit:10,queueLimit:0});

// Test connection on startup
db.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL connection failed:", err);
    process.exit(1);
  } else {
    console.log("✅ MySQL connected");
    connection.release();
  }
});

// Create HTTP server for force logout requests
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  console.log(`HTTP Request: ${req.method} ${req.url}`);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle force logout
  if (req.method === 'POST' && req.url === '/force-logout') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        console.log('Received body:', body);
        const data = JSON.parse(body);
        console.log('Parsed data:', data);
        
        handleForceLogout(data);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Force logout request processed' }));
      } catch (error) {
        console.error('Error parsing force logout request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON: ' + error.message }));
      }
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Server error' }));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

// Setup WebSocket server on the HTTP server
const wss = new WebSocket.Server({ server });

// Store active connections
let clients = {};

// Broadcast to all admin clients
function broadcastToAdmins(message) {
  let adminCount = 0;
  Object.keys(clients).forEach(userId => {
    const client = clients[userId];
    if (client.role === 'admin' && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
      adminCount++;
    }
  });
  console.log(`📢 Broadcasted to ${adminCount} admin(s):`, message.type);
}

// Get list of active users
function getActiveUsers() {
  return Object.keys(clients).map(userId => ({
    user_id: parseInt(userId),
    username: clients[userId].username || 'Unknown',
    role: clients[userId].role || 'unknown'
  }));
}

// Update user active status in DB
function updateUserActive(userId, isActive, role = null) {
  const status = isActive ? 1 : 0;
  const sql = `UPDATE users SET is_active = ${status}${role ? `, role = '${mysql.escape(role)}'` : ''} WHERE id = ?`;
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error(`❌ DB update failed for user #${userId}:`, err);
    } else if (result.affectedRows > 0) {
      console.log(`✅ User #${userId} (${isActive ? 'active' : 'inactive'}) updated in DB`);
    } else {
      console.log(`⚠️ No rows affected for user #${userId} - user may not exist`);
    }
  });
}

// Validate user and get role from DB
function validateUser(userId, sentRole = null, callback) {
  const sql = "SELECT id, username, role FROM users WHERE id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(`❌ DB query failed for user #${userId}:`, err);
      callback({ valid: false, error: 'DB error' });
      return;
    }
    if (results.length === 0) {
      console.log(`❌ User #${userId} not found in DB`);
      callback({ valid: false, error: 'User not found' });
      return;
    }
    const user = results[0];
    
    // If sentRole provided, validate match
    if (sentRole && user.role !== sentRole) {
      console.log(`❌ Role mismatch for user #${userId}: sent '${sentRole}', DB '${user.role}'`);
      callback({ valid: false, error: 'Role mismatch' });
      return;
    }
    
    console.log(`✅ User #${userId} validated: role='${user.role}', username='${user.username}'`);
    callback({ valid: true, role: user.role, username: user.username });
  });
}

// Function to handle force logout
function handleForceLogout(data) {
  const userId = parseInt(data.user_id);
  console.log(`🚪 Force logout request for user #${userId}`);
  console.log(`📋 Current connected clients:`, Object.keys(clients));
  
  if (clients[userId]) {
    const client = clients[userId];
    const username = client.username || 'unknown';
    console.log(`✅ Found client - Username: ${username}, WS State: ${client.ws.readyState}`);
    
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'force_logout',
        message: data.message || 'Logged out by an administrator.'
      }));
      
      console.log(`📤 Force logout message sent to user #${userId} (${username})`);
      
      // Update database to inactive
      updateUserActive(userId, false);
      
      // Close connection after 1 second to give time for message delivery
      setTimeout(() => {
        if (clients[userId]) {
          clients[userId].ws.close(1000, "Forced logout by admin");
          delete clients[userId];
          console.log(`🔌 Connection closed for user #${userId} (${username})`);
        }
      }, 1000);
    } else {
      console.log(`❌ WebSocket not open for user #${userId} (${username})`);
      // Still update DB
      updateUserActive(userId, false);
    }
  } else {
    console.log(`❌ User #${userId} not in clients list`);
    // Update DB anyway if possible
    updateUserActive(userId, false);
  }
}

wss.on("connection", (ws, req) => {
  console.log("🔌 New client connected from:", req.socket.remoteAddress);
  
  let currentUserId = null; // Track this connection's user ID

  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("📨 Received message:", data);

      if (data.type === "login") {
        const userId = parseInt(data.user_id);
        const sentRole = data.role || null;  // Optional, for future validation
        const sentUsername = data.username || 'Unknown User';

        if (!userId || isNaN(userId)) {
          console.error("❌ Invalid user_id in login message:", data);
          ws.send(JSON.stringify({ error: "Invalid user_id" }));
          ws.close(1008, "Invalid user_id");
          return;
        }

        // Validate user via DB
        validateUser(userId, sentRole, (validation) => {
          if (!validation.valid) {
            console.error(`❌ Login rejected for #${userId}: ${validation.error}`);
            ws.send(JSON.stringify({ error: validation.error }));
            ws.close(1008, validation.error);
            return;
          }

          const { role, username } = validation;

          // Close existing connection for this user
          if (clients[userId]) {
            console.log(`⚠️ User #${userId} already connected, closing old connection`);
            clients[userId].ws.close(1000, "Replaced by new connection");
            delete clients[userId];
          }

          // Store new connection (use DB username/role)
          clients[userId] = { 
            ws, 
            role, 
            username,  // Override with DB username if mismatch
            timestamp: Date.now() 
          };
          currentUserId = userId;
          
          console.log(`✅ User #${userId} (${username}) logged in as ${role}`);
          console.log(`📊 Total connected users: ${Object.keys(clients).length}`);

          // Update database
          updateUserActive(userId, true);

          // Send active users list to the newly connected user
          const activeUsers = getActiveUsers();
          ws.send(JSON.stringify({
            type: 'active_users',
            users: activeUsers
          }));
          console.log(`📤 Sent active users list to user #${userId}:`, activeUsers.length, 'users');

          // Broadcast new connection to all admins
          broadcastToAdmins({
            type: 'user_connected',
            user_id: userId,
            username: username,
            role: role
          });
        });
      }
    } catch (err) {
      console.error("❌ Invalid message received:", err.message);
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  });

  ws.on("pong", () => {
    // Heartbeat response
  });

  ws.on("close", (code, reason) => {
    console.log(`🔌 WS closed (code: ${code}, reason: ${reason})`);
    clearInterval(heartbeatInterval);

    // Find and remove the disconnected user
    if (currentUserId && clients[currentUserId]) {
      const username = clients[currentUserId].username || 'unknown';
      const role = clients[currentUserId].role || 'unknown';
      
      console.log(`👋 User #${currentUserId} (${username}) disconnected`);
      
      updateUserActive(currentUserId, false);
      
      // Broadcast disconnection to all admins
      broadcastToAdmins({
        type: 'user_disconnected',
        user_id: currentUserId,
        username: username,
        role: role
      });
      
      delete clients[currentUserId];
      console.log(`📊 Total connected users: ${Object.keys(clients).length}`);
    }
  });

  ws.on("error", (err) => {
    console.error("❌ WS error:", err);
    if (currentUserId && clients[currentUserId]) {
      delete clients[currentUserId];  // Cleanup on error
    }
  });
});

// Get local IP and start server
const PORT = 8080;
const HOST = getLocalIPAddress();

server.listen(PORT, '0.0.0.0', () => {
  console.log("=".repeat(50));
  console.log("🚀 WebSocket Server Started Successfully!");
  console.log("=".repeat(50));
  console.log(`🌐 Local IP: ${HOST}`);
  console.log(`🔗 HTTP Server: http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://${HOST}:${PORT}`);
  console.log(`📱 Connect from other devices: ws://${HOST}:${PORT}`);
  console.log("=".repeat(50));
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  
  // Notify all connected users
  Object.keys(clients).forEach(userId => {
    if (clients[userId].ws.readyState === WebSocket.OPEN) {
      clients[userId].ws.send(JSON.stringify({
        type: 'server_shutdown',
        message: 'Server is shutting down'
      }));
      clients[userId].ws.close(1000, "Server shutdown");
    }
  });
  
  server.close(() => {
    wss.close(() => {
      db.end((err) => {
        if (err) console.error("❌ DB close error:", err);
        console.log("✅ Server closed gracefully");
        process.exit(0);
      });
    });
  });
});