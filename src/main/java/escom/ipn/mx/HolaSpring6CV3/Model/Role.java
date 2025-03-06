package escom.ipn.mx.HolaSpring6CV3.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String nombre;

    //@ManyToMany(mappedBy = "roles")
    //private Set<UserModel> users;

    // Getters y setters
    public Long getId(){
        return id;
    }

    public void setId(Long id){
        this.id = id;
    }

    public String getNombre(){
        return nombre;
    }

    public void setNombre(String nombre){
        this.nombre = nombre;
    }

    //public Set<UserModel> getUsers(){
    //    return users;
    //}

    //public void setUsers(Set<UserModel> users){
    //    this.users = users;
    //}
}
