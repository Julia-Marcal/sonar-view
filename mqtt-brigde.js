const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');
const os = require('os');

const HTTP_PORT = process.env.HTTP_PORT ? Number(process.env.HTTP_PORT) : 5000;
const HTTP_HOST = process.env.HTTP_HOST || '0.0.0.0';
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'sensor/distancia';

const client = mqtt.connect(MQTT_BROKER_URL, {
    reconnectPeriod: 5000,     
    connectTimeout: 30 * 1000, 
});

client.on('connect', () => {
    console.log('Conectado ao broker MQTT:', MQTT_BROKER_URL);
});

client.on('reconnect', () => {
    console.log('Tentando reconectar ao broker MQTT...');
});

client.on('error', (err) => {
    console.error('Erro na conexão MQTT:', err && err.message ? err.message : err);
});

client.on('close', () => {
    console.log('Conexão MQTT fechada. O cliente tentará reconectar se possível.');
});

app.post('/publish', (req, res) => {
    const distance = req.body.distance;

    if (distance === undefined) {
    console.log('Requisição inválida: campo "distance" ausente.');
        return res.status(400).send('Erro: campo "distance" ausente.');
    }

    if (!client.connected) {
    console.warn('MQTT não conectado — não será possível publicar no momento.');
        return res.status(503).send('MQTT broker indisponível. Tente novamente mais tarde.');
    }

    const payload = distance.toString();
    
    client.publish(MQTT_TOPIC, payload, { qos: 0, retain: false }, (err) => {
        if (err) {
            console.error(`Falha ao publicar no MQTT: ${err && err.message ? err.message : err}`);
            return res.status(500).send('Erro ao publicar no MQTT');
        }
        
    console.log(`Recebido: ${payload} cm. Publicado no tópico: ${MQTT_TOPIC}`);
        res.status(200).send('OK');
    });
});

function getLocalAddresses() {
    const nets = os.networkInterfaces();
    const results = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    return results;
}

const server = app.listen(HTTP_PORT, HTTP_HOST, () => {
    console.log(`HTTP Bridge rodando na porta ${HTTP_PORT}`);
    const addrs = getLocalAddresses();
    if (addrs.length) {
        for (const a of addrs) {
            console.log(`Aguardando requisições POST em http://${a}:${HTTP_PORT}/publish`);
        }
    } else {
        console.log(`Aguardando requisições POST em http://${HTTP_HOST}:${HTTP_PORT}/publish`);
    }
});


function shutdown() {
    console.log('\nEncerrando...');
    try {
        client.end(false, () => {
            console.log('MQTT client finalizado.');
        });
    } catch (e) {
        console.warn('Erro ao finalizar client MQTT:', e && e.message ? e.message : e);
    }
    server.close(() => {
        console.log('Servidor HTTP finalizado.');
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);