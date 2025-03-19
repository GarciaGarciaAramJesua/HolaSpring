package escom.ipn.hola_spring_6IV3.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/view/admin")
public class AdminController {

    @GetMapping("/all-users")
    public String allUsersPage() {
        return "all-users";
    }

}
