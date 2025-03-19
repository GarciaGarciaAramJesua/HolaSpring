package escom.ipn.hola_spring_6IV3.jwt;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

// Generar y validar JWT
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpirationInMills;

    // Generar un token sin claims adicionales
    public String generateToken(UserDetails user) {
        return getToken(new HashMap<>(), user);
    }

    // Generar un token con claims adicionales
    public String generateToken(Map<String, Object> extraClaims, UserDetails user) {
        return getToken(extraClaims, user);
    }

    // Método para obtener la clave secreta de forma segura
    private Key getKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
        // Permite crear una nueva instancia de nuestra secret key
    }

    @SuppressWarnings("deprecation")
    private String getToken(Map<String, Object> extraClaims, UserDetails user) {
        return Jwts.builder()
            .setClaims(extraClaims)
            .setSubject(user.getUsername())
            .setIssuedAt(new Date(System.currentTimeMillis()))
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationInMills))
            .signWith(getKey())
            .compact();
    }

    // Método para extraer los claims del token
    @SuppressWarnings("deprecation")
    private Claims extractClaims(String token) {
        return Jwts.parser()
            .setSigningKey(getKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
    
    // Método para verificar si el token ha expirado
    private boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }
    
    // Método para extraer el usuario del token
    public String extractUsername(String token){
        return extractClaims(token).getSubject();
    }
    
    // Método para extraer toda la información del token
    public Map<String, Object> extractAllInfo(String token) {
        Claims claims = extractClaims(token);
        Map<String, Object> info = new HashMap<>();
        info.put("username", claims.getSubject());
        info.put("issuedAt", claims.getIssuedAt());
        info.put("expiration", claims.getExpiration());
        info.putAll(claims);
        return info;
    }

    // Método para validar el token
    public boolean isTokenValid(String token, UserDetails user) {
        try {
            final String username = extractUsername(token);
            return username.equals(user.getUsername()) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}
