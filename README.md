# HolaSpring

This is a Java basic project created with Spring Boot.
This project contains Java codes that generates a particular Hello World code, uses a controller REST to creat a endpoint and submit at the localhost:8080/hola the content that wants to show.
At the same time, the project includes Spring dependencies like Spring-Web and MySQL.
Finally, follow the next steps to run this project on a local environment:

1. Open a terminal on your device and execute:
git clone https://github.com/GarciaGarciaAramJesua/HolaSpring.git
2. At the same terminal, get in on the directory where you wanna upload the project, navigating with the next command:
cd Directory1
Directory1 cd Directory2
Directory1/Directory2
3. Check if you have installed in your device JDK and Apache Maven, you can watch it executing the next command at the terminal:
java -version
mvn -version
3.1 If you don't have it, download and install them
4. Build project:
If you're on Unix o MacOS execute at the terminal:
./mvnw clean install
Else on Windows:
mvnw.cmd clean install
5. Execute project:
./mvnw clean package
./mvnw spring-boot:run
6. Access to the endpoint on your browser at http://localhost:8080/

 
