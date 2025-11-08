# Sonar View

O **Sonar View** é um protótipo de tecnologia assistiva projetado para auxiliar pessoas com deficiência visual, detectando obstáculos através de um sensor ultrassônico (HC-SR04).  
Ao medir a distância de objetos à frente, o sistema aciona alertas visuais (LEDs), sonoros (buzzer) e táteis (motor vibratório).  
Além disso, os dados são transmitidos pela Internet via protocolo **MQTT**, permitindo o monitoramento remoto em dashboards ou aplicações externas.  
O projeto pode ser reproduzido com componentes simples, como um Arduino Uno e um módulo Wi-Fi ESP8266.

---

## 🧭 Visão geral

- O microcontrolador mede a distância e, quando necessário, envia uma requisição HTTP POST para o bridge (endpoint `/publish`).
- O bridge (`mqtt-brigde.js`) recebe a requisição e repassa a leitura para um broker MQTT no tópico configurado.
- A interface entre o dispositivo e o bridge é feita por HTTP simples; o bridge faz a ponte para MQTT.

---

## ⚙️ Arquitetura de Software

O sistema é composto por dois módulos principais:

### 1. Firmware (Arduino/ESP8266)
- Responsável por ler as medições do sensor ultrassônico (biblioteca `NewPing.h`).
- Analisa a distância e define o estado (verde, amarelo, vermelho).
- Envia os dados via HTTP POST para o bridge Node.js.  
- **Bibliotecas utilizadas:**
  - `NewPing.h` — controle do sensor HC-SR04
  - `ESP8266WiFi.h` — conexão Wi-Fi
  - `WiFiClient.h` — envio de requisições HTTP

### 2. Bridge HTTP → MQTT (Node.js)
- Script `mqtt-brigde.js` que recebe requisições HTTP no endpoint `/publish`.
- Publica os valores recebidos no broker MQTT (ex.: `mqtt://localhost:1883`).
- **Dependências:**
  - `express` — servidor HTTP
  - `mqtt` — cliente MQTT

---

## 🧩 Hardware e Montagem

**Plataforma:** Arduino Uno R3  
**Módulo de Rede:** ESP8266 com adaptador lógico (3.3V)  
**Sensor:** HC-SR04 (ultrassônico, alcance 2–400 cm, precisão ±3 mm)  
**Atuadores:**  
- LED verde (distância segura)  
- LED amarelo (alerta médio)  
- LED vermelho (alerta crítico)  
- Buzzer ativo 5V  
- Motor vibratório DC 3V  

**Alimentação:** via USB (5V, 500 mA)

### Esquema de ligação

| Componente | Pino Arduino | Descrição |
|-------------|---------------|------------|
| HC-SR04 Trig | 9 | Pulso de envio |
| HC-SR04 Echo | 10 | Retorno do sinal |
| LED Verde | 11 | Estado seguro |
| LED Amarelo | 12 | Alerta médio |
| LED Vermelho | 13 | Alerta crítico |
| Buzzer | 8 | Alerta sonoro |
| ESP8266 RX/TX | 2 / 3 | Comunicação serial com SoftwareSerial |

**Observação:** Utilize um adaptador para alimentar o ESP8266 com 3.3V e proteger contra sobrecorrente.

*(Opcional)* Caso haja prototipagem física, a estrutura pode ser impressa em 3D (PLA, 20% infill), com dimensões de 10 x 5 x 3 cm, contendo aberturas para o sensor ultrassônico e o buzzer.

---

## 🌐 Interfaces e Protocolos de Comunicação

O Sonar View utiliza múltiplas interfaces e protocolos para integrar sensores, atuadores e comunicação remota:

### Comunicação entre módulos

- **Serial UART (Arduino ↔ ESP8266)** — Comunicação entre microcontrolador e módulo Wi-Fi (9600 bps).  
- **HTTP (ESP8266 → Bridge Node.js)** — Envio dos dados via requisição POST (`application/x-www-form-urlencoded`).  
- **MQTT (Bridge → Broker → Clientes)** — Publicação das medições no tópico `sensor/distancia`.

### Exemplo de mensagem HTTP

```
POST /publish
Content-Type: application/x-www-form-urlencoded
distance=25
```

### Exemplo de payload MQTT publicado

```json
{
  "sensor": "ultrasonic",
  "distance_cm": 25,
  "status": "alert"
}
```

### Tópicos MQTT utilizados

- `sensor/distancia` — Leituras em tempo real  
- `sensor/status` — Mudanças de estado (opcional)

---

## 🌍 Comunicação via Internet (TCP/IP + MQTT)

O sistema segue uma arquitetura IoT em três camadas:

1. **Camada de Dispositivo (Arduino + ESP8266):**  
   Mede distâncias e envia dados via HTTP (TCP/IP) para o bridge.

2. **Camada de Gateway (Bridge Node.js):**  
   Recebe os dados HTTP e os publica via **MQTT** para o broker.

3. **Camada de Aplicação (Broker MQTT / Dashboard):**  
   Clientes MQTT (como Node-RED, MQTT Explorer ou dashboards web) podem visualizar as leituras em tempo real.

### Topologia resumida

```
[Arduino + ESP8266] --HTTP/TCP--> [Bridge Node.js] --MQTT--> [Broker/Cloud Dashboard]
```

---

## 💻 Instalação do bridge (Node.js)

1. Instale dependências (na raiz do projeto onde está `package.json`):

```bash
npm install
```

2. Execute um broker MQTT (por exemplo, Mosquitto) localmente ou use um broker remoto.

3. Inicie o bridge (exemplo de variáveis de ambiente):

```bash
MQTT_BROKER_URL="mqtt://10.0.0.98:1883" node mqtt-brigde.js
```

Variáveis úteis:
- `MQTT_BROKER_URL` — URL do broker MQTT (ex.: `mqtt://127.0.0.1:1883`)
- `MQTT_TOPIC` — tópico onde as leituras são publicadas (ex.: `sensor/distancia`)
- `HTTP_PORT` / `HTTP_HOST` — porta/host onde o bridge escuta

---

## 🧪 Testando o endpoint manualmente

Você pode testar o bridge sem o dispositivo usando `curl`:

```bash
curl -X POST http://<bridge-ip>:5000/publish -d "distance=25"
```

Substitua `5000` pela porta em que o bridge estiver executando.

---

## ⚡ Configuração do Arduino / ESP

No sketch dentro de `sonar-view-arduino-logic` ajuste:

- `SERVER_IP` e `SERVER_PORT` para o host/porta do bridge.
- `SSID` e `PASSWORD` da rede Wi-Fi.

Após essas alterações, faça upload do sketch para a placa.  
O microcontrolador enviará leituras automaticamente ao detectar mudança de estado.

---

## 🧰 Depuração

- Verifique a saída Serial do Arduino/ESP8266 para ver leituras e erros de conexão Wi-Fi.  
- Verifique os logs no terminal onde o bridge está rodando — o script mostrará conexões ao broker e publicações MQTT.  

**Dicas:**
- Se o broker estiver inacessível, o script mostrará mensagens de erro no console.  
- Para ambientes de produção, adicione autenticação MQTT (usuário/senha) ou TLS.

---

## 📁 Estrutura do Projeto

```
sonar-view/
│
├── sonar-view-arduino-logic/     # Código do microcontrolador (Arduino/ESP)
│   └── sonar_view.ino
│
├── mqtt-brigde.js                # Bridge HTTP → MQTT
├── package.json                  # Dependências do Node.js
├── LICENSE                       # Licença do projeto
└── README.md                     # Documentação completa
```

