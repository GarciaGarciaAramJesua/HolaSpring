package escom.ipn.mx.HolaSpring6CV3;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "escom.ipn.mx.HolaSpring6CV3")
public class HolaSpring6Cv3Application {

	public static void main(String[] args) {
		SpringApplication.run(HolaSpring6Cv3Application.class, args);
		//System.out.println("Hola Spring Boot");
	}

}
