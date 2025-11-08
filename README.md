# Sonar View

Projeto simples que lê distância a partir de um sensor ultrassônico conectado a um microcontrolador (ex.: ESP8266/Arduino) e publica as leituras em um broker MQTT através de um pequeno bridge HTTP em Node.js.

## Visão geral

- O microcontrolador mede a distância e, quando necessário, envia uma requisição HTTP POST para o bridge (endpoint `/publish`).
- O bridge (`mqtt-brigde.js`) recebe a requisição e repassa a leitura para um broker MQTT no tópico configurado.
- A interface entre o dispositivo e o bridge é feita por HTTP simples; o bridge faz a ponte para MQTT.

## Componentes

- `sonar-view-arduino-logic` — diretório com o código/ sketch do Arduino/ESP que faz a leitura do sensor ultrassônico, avalia estado (verde/amarelo/vermelho) e chama `sendHTTP` para enviar leituras ao bridge.
- `mqtt-brigde.js` — bridge HTTP → MQTT que expõe o endpoint `/publish` e publica mensagens no broker MQTT.
- `package.json` — dependências e scripts do Node.js.
- `LICENSE` — licença do projeto.

## Como funciona (fluxo)

1. O microcontrolador mede a distância com o sensor ultrassônico.
2. Quando há leitura ou mudança de estado, o sketch faz um POST para `http://<IP_DO_BRIDGE>:<PORT>/publish` com o payload (por exemplo `distance=25`).
3. O bridge Node recebe a requisição e publica o valor no tópico MQTT configurado (ex.: `sensor/distancia`).
4. Consumidores MQTT (dashboards, serviços) podem assinar o tópico e reagir às leituras.

## Instalação do bridge (Node.js)

1. Instale dependências (na raiz do projeto onde está `package.json`):

```bash
npm install
```

2. Execute um broker MQTT (por exemplo, Mosquitto) localmente ou use um broker remoto.

3. Inicie o bridge (exemplo de variáveis de ambiente):

```bash
MQTT_BROKER_URL="mqtt://10.0.0.98:1883" node mqtt-brigde.js
```

Variáveis úteis (dependendo da implementação em `mqtt-brigde.js`):
- `MQTT_BROKER_URL` — URL do broker MQTT (ex.: `mqtt://127.0.0.1:1883`).
- `MQTT_TOPIC` — tópico onde as leituras são publicadas (ex.: `sensor/distancia`).
- `HTTP_PORT` / `HTTP_HOST` — porta/host onde o bridge escuta (se suportado pelo script).

## Testando o endpoint manualmente

Você pode testar o bridge sem o dispositivo usando `curl`:

```bash
curl -X POST http://<bridge-ip>:5000/publish -d "distance=25"
```

Altere `5000` para a porta em que o bridge estiver rodando (se diferente).

## Configuração do Arduino / ESP

No sketch dentro de `sonar-view-arduino-logic` ajuste o seguinte:

- `SERVER_IP` e `SERVER_PORT` (ou a URL completa) para apontar para o host/porta do bridge.
- `SSID` e `PASSWORD` da rede Wi‑Fi para conectar o dispositivo.

Após essas alterações, faça upload do sketch para a placa. O sketch deverá enviar leituras automaticamente quando o estado mudar.

## Depuração

- Verifique a saída Serial do microcontrolador para ver leituras e erros de conexão Wi‑Fi.
- Verifique os logs no terminal onde o bridge está rodando — o script deve mostrar conexões ao broker e as publicações (ou erros caso o broker esteja indisponível).

## Observações

- O bridge depende do broker MQTT estar acessível; se o cliente MQTT não estiver conectado, as publicações podem falhar. Verifique as mensagens de retorno do `mqtt-brigde.js`.
- Se desejar, você pode estender o bridge para autenticar com o broker (usuário/senha) ou adicionar TLS.

## Arquivos importantes

- `sonar-view-arduino-logic/` — código do dispositivo
- `mqtt-brigde.js` — bridge HTTP → MQTT
- `package.json` — dependências do Node.js
- `LICENSE` — licença do projeto

---

Se quiser, eu posso:
- Traduzir o README para inglês.
- Adicionar um exemplo mínimo de sketch do Arduino (upload-ready).
- Adicionar um script de teste automatizado que envia mensagens de exemplo ao bridge.

Diga o que prefere que eu faça a seguir.