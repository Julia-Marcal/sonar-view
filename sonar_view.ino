// Pins
const int trigPin = 9;
const int echoPin = 10;
const int greenLED = 11;
const int yellowLED = 12;
const int redLED = 13;
const int buzzer = 8;

long duration;
int distance;

bool greenState = false;
bool yellowState = false;
bool redState = false;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  pinMode(greenLED, OUTPUT);
  pinMode(yellowLED, OUTPUT);
  pinMode(redLED, OUTPUT);
  pinMode(buzzer, OUTPUT);

  Serial.begin(9600);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;

  Serial.print("Distance: ");
  Serial.println(distance);

  if (distance > 15) {
    greenState = true;
    yellowState = false;
    redState = false;
  } 
  else if (distance <= 15 && distance > 5) {
    greenState = false;
    yellowState = true;
    redState = false;
  } 
  else if (distance <= 5) {
    greenState = false;
    yellowState = false;
    redState = true;
  }

  digitalWrite(greenLED, greenState ? HIGH : LOW);
  digitalWrite(yellowLED, yellowState ? HIGH : LOW);
  digitalWrite(redLED, redState ? HIGH : LOW);

  digitalWrite(buzzer, redState ? HIGH : LOW);

  delay(100);
}
