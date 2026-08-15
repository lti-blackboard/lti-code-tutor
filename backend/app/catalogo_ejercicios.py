"""
Catálogo inicial de ejercicios del curso.

Está separado del resto del backend a propósito: agregar, editar o quitar
ejercicios es solo modificar esta lista, sin tocar la lógica de la API.

Cada ejercicio trae un "codigo_base" con un error intencional o incompleto,
para que el estudiante lo resuelva con ayuda del tutor de IA.
"""

CATALOGO_EJERCICIOS = [
    # --- TEMA 1: Variables y tipos de datos ---
    {
        "id": "var-01-py", "tema": "variables", "orden": 1,
        "titulo": "Calcular el precio con IVA",
        "enunciado": "Completa la función para que calcule el precio final de un producto agregando un 19% de IVA.",
        "lenguaje": "python", "nivel": "básico",
        "codigo_base": "def precio_con_iva(precio):\n    iva = \"0.19\"\n    return precio + precio * iva\n\nprint(precio_con_iva(1000))",
    },
    {
        "id": "var-02-py", "tema": "variables", "orden": 2,
        "titulo": "Convertir minutos a horas",
        "enunciado": "Completa la función para que retorne cuántas horas completas hay en una cantidad de minutos.",
        "lenguaje": "python", "nivel": "básico",
        "codigo_base": "def minutos_a_horas(minutos):\n    horas = minutos / 60\n    return horas\n\nprint(minutos_a_horas(150))",
    },
    {
        "id": "var-01-java", "tema": "variables", "orden": 3,
        "titulo": "Calcular el precio con IVA",
        "enunciado": "Completa el método para que calcule el precio final de un producto agregando un 19% de IVA.",
        "lenguaje": "java", "nivel": "básico",
        "codigo_base": "public class Main {\n    static double precioConIva(int precio) {\n        String iva = \"0.19\";\n        return precio + precio * iva;\n    }\n    public static void main(String[] args) {\n        System.out.println(precioConIva(1000));\n    }\n}",
    },
    {
        "id": "var-02-java", "tema": "variables", "orden": 4,
        "titulo": "Convertir minutos a horas",
        "enunciado": "Completa el método para que retorne cuántas horas completas hay en una cantidad de minutos.",
        "lenguaje": "java", "nivel": "básico",
        "codigo_base": "public class Main {\n    static int minutosAHoras(int minutos) {\n        int horas = minutos / 60;\n        return horas\n    }\n    public static void main(String[] args) {\n        System.out.println(minutosAHoras(150));\n    }\n}",
    },

    # --- TEMA 2: Condicionales ---
    {
        "id": "cond-01-py", "tema": "condicionales", "orden": 5,
        "titulo": "Determinar si un año es bisiesto",
        "enunciado": "Completa la función para que retorne True si el año es bisiesto, False en caso contrario.",
        "lenguaje": "python", "nivel": "básico",
        "codigo_base": "def es_bisiesto(anio):\n    if anio % 4 == 0:\n        return True\n    return False\n\nprint(es_bisiesto(1900))  # deberia ser False",
    },
    {
        "id": "cond-02-py", "tema": "condicionales", "orden": 6,
        "titulo": "Clasificar una nota",
        "enunciado": "Completa la función para que retorne 'Aprobado' si la nota es mayor o igual a 4.0, y 'Reprobado' en caso contrario.",
        "lenguaje": "python", "nivel": "básico",
        "codigo_base": "def clasificar(nota):\n    if nota = 4.0:\n        return \"Aprobado\"\n    return \"Reprobado\"\n\nprint(clasificar(5.5))",
    },
    {
        "id": "cond-01-java", "tema": "condicionales", "orden": 7,
        "titulo": "Determinar si un año es bisiesto",
        "enunciado": "Completa el método para que retorne true si el año es bisiesto, false en caso contrario.",
        "lenguaje": "java", "nivel": "básico",
        "codigo_base": "public class Main {\n    static boolean esBisiesto(int anio) {\n        if (anio % 4 = 0) {\n            return true;\n        }\n        return false;\n    }\n    public static void main(String[] args) {\n        System.out.println(esBisiesto(1900));\n    }\n}",
    },
    {
        "id": "cond-02-java", "tema": "condicionales", "orden": 8,
        "titulo": "Clasificar una nota",
        "enunciado": "Completa el método para que retorne 'Aprobado' si la nota es mayor o igual a 4.0, y 'Reprobado' en caso contrario.",
        "lenguaje": "java", "nivel": "básico",
        "codigo_base": "public class Main {\n    static String clasificar(double nota) {\n        if (nota >= 4.0)\n            return \"Aprobado\";\n    }\n    public static void main(String[] args) {\n        System.out.println(clasificar(5.5));\n    }\n}",
    },

    # --- TEMA 3: Ciclos ---
    {
        "id": "ciclo-01-py", "tema": "ciclos", "orden": 9,
        "titulo": "Sumar los primeros N números",
        "enunciado": "Completa la función para que sume todos los números desde 1 hasta n (incluido).",
        "lenguaje": "python", "nivel": "básico",
        "codigo_base": "def sumar_hasta(n):\n    total = 0\n    for i in range(n):\n        total += i\n    return total\n\nprint(sumar_hasta(5))  # deberia dar 15",
    },
    {
        "id": "ciclo-02-py", "tema": "ciclos", "orden": 10,
        "titulo": "Contar vocales en un texto",
        "enunciado": "Completa la función para que cuente cuántas vocales tiene un texto.",
        "lenguaje": "python", "nivel": "intermedio",
        "codigo_base": "def contar_vocales(texto):\n    vocales = \"aeiou\"\n    contador = 0\n    for letra in texto:\n        if letra == vocales:\n            contador += 1\n    return contador\n\nprint(contar_vocales(\"programacion\"))",
    },
    {
        "id": "ciclo-01-java", "tema": "ciclos", "orden": 11,
        "titulo": "Sumar los primeros N números",
        "enunciado": "Completa el método para que sume todos los números desde 1 hasta n (incluido).",
        "lenguaje": "java", "nivel": "básico",
        "codigo_base": "public class Main {\n    static int sumarHasta(int n) {\n        int total = 0;\n        for (int i = 0; i < n; i++) {\n            total += i;\n        }\n        return total;\n    }\n    public static void main(String[] args) {\n        System.out.println(sumarHasta(5));\n    }\n}",
    },
    {
        "id": "ciclo-02-java", "tema": "ciclos", "orden": 12,
        "titulo": "Contar vocales en un texto",
        "enunciado": "Completa el método para que cuente cuántas vocales tiene un texto.",
        "lenguaje": "java", "nivel": "intermedio",
        "codigo_base": "public class Main {\n    static int contarVocales(String texto) {\n        String vocales = \"aeiou\";\n        int contador = 0;\n        for (int i = 0; i < texto.length(); i++) {\n            if (vocales.contains(texto.charAt(i))) {\n                contador++;\n            }\n        }\n        return contador;\n    }\n    public static void main(String[] args) {\n        System.out.println(contarVocales(\"programacion\"));\n    }\n}",
    },

    # --- TEMA 4: Funciones ---
    {
        "id": "func-01-py", "tema": "funciones", "orden": 13,
        "titulo": "Calcular el promedio de una lista",
        "enunciado": "Completa la función para que calcule el promedio de una lista de notas.",
        "lenguaje": "python", "nivel": "básico",
        "codigo_base": "def promedio(notas):\n    return sum(notas) / len(notas)\n\nnotas = [6.5, 5.8, None, 7.0]\nprint(promedio(notas))",
    },
    {
        "id": "func-02-py", "tema": "funciones", "orden": 14,
        "titulo": "Función con valor por defecto",
        "enunciado": "Completa la función saludar para que, si no se le pasa un nombre, salude con 'Hola, invitado'.",
        "lenguaje": "python", "nivel": "intermedio",
        "codigo_base": "def saludar(nombre):\n    return f\"Hola, {nombre}\"\n\nprint(saludar())",
    },
    {
        "id": "func-01-java", "tema": "funciones", "orden": 15,
        "titulo": "Calcular el promedio de un arreglo",
        "enunciado": "Completa el método para que calcule el promedio de un arreglo de notas.",
        "lenguaje": "java", "nivel": "básico",
        "codigo_base": "public class Main {\n    static double promedio(double[] notas) {\n        double suma = 0;\n        for (double n : notas) {\n            suma += n;\n        }\n        return suma / notas.length;\n    }\n    public static void main(String[] args) {\n        double[] notas = {};\n        System.out.println(promedio(notas));\n    }\n}",
    },
    {
        "id": "func-02-java", "tema": "funciones", "orden": 16,
        "titulo": "Sobrecarga de métodos",
        "enunciado": "Agrega una segunda versión del método sumar que reciba 3 enteros en vez de 2.",
        "lenguaje": "java", "nivel": "intermedio",
        "codigo_base": "public class Main {\n    static int sumar(int a, int b) {\n        return a + b;\n    }\n    public static void main(String[] args) {\n        System.out.println(sumar(2, 3, 4));\n    }\n}",
    },

    # --- TEMA 5: Listas / arreglos ---
    {
        "id": "lista-01-py", "tema": "listas", "orden": 17,
        "titulo": "Encontrar el número mayor",
        "enunciado": "Completa la función para que retorne el número más grande de una lista, sin usar la función max().",
        "lenguaje": "python", "nivel": "intermedio",
        "codigo_base": "def encontrar_mayor(numeros):\n    mayor = 0\n    for n in numeros:\n        if n > mayor:\n            mayor = n\n    return mayor\n\nprint(encontrar_mayor([-5, -2, -8, -1]))  # deberia dar -1",
    },
    {
        "id": "lista-02-py", "tema": "listas", "orden": 18,
        "titulo": "Eliminar duplicados",
        "enunciado": "Completa la función para que retorne la lista sin elementos duplicados, manteniendo el orden original.",
        "lenguaje": "python", "nivel": "intermedio",
        "codigo_base": "def sin_duplicados(lista):\n    resultado = []\n    for elemento in lista:\n        resultado.append(elemento)\n    return resultado\n\nprint(sin_duplicados([1, 2, 2, 3, 1, 4]))",
    },
    {
        "id": "lista-01-java", "tema": "listas", "orden": 19,
        "titulo": "Encontrar el número mayor",
        "enunciado": "Completa el método para que retorne el número más grande de un arreglo, sin usar Math.max().",
        "lenguaje": "java", "nivel": "intermedio",
        "codigo_base": "public class Main {\n    static int encontrarMayor(int[] numeros) {\n        int mayor = 0;\n        for (int n : numeros) {\n            if (n > mayor) mayor = n;\n        }\n        return mayor;\n    }\n    public static void main(String[] args) {\n        int[] numeros = {-5, -2, -8, -1};\n        System.out.println(encontrarMayor(numeros));\n    }\n}",
    },
    {
        "id": "lista-02-java", "tema": "listas", "orden": 20,
        "titulo": "Sumar elementos de un ArrayList",
        "enunciado": "Completa el método para que sume todos los elementos de un ArrayList de enteros.",
        "lenguaje": "java", "nivel": "intermedio",
        "codigo_base": "import java.util.ArrayList;\n\npublic class Main {\n    static int sumarLista(ArrayList<Integer> numeros) {\n        int total = 0;\n        for (int i = 0; i <= numeros.size(); i++) {\n            total += numeros.get(i);\n        }\n        return total;\n    }\n    public static void main(String[] args) {\n        ArrayList<Integer> numeros = new ArrayList<>();\n        numeros.add(1); numeros.add(2); numeros.add(3);\n        System.out.println(sumarLista(numeros));\n    }\n}",
    },

    # --- TEMA 6: Recursividad ---
    {
        "id": "rec-01-py", "tema": "recursividad", "orden": 21,
        "titulo": "Factorial de un número",
        "enunciado": "Completa la función recursiva para que calcule el factorial de n.",
        "lenguaje": "python", "nivel": "avanzado",
        "codigo_base": "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n)\n\nprint(factorial(5))  # deberia dar 120",
    },
    {
        "id": "rec-02-py", "tema": "recursividad", "orden": 22,
        "titulo": "Sucesión de Fibonacci",
        "enunciado": "Completa la función recursiva para que retorne el n-ésimo número de Fibonacci.",
        "lenguaje": "python", "nivel": "avanzado",
        "codigo_base": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1)\n\nprint(fibonacci(6))  # deberia dar 8",
    },
    {
        "id": "rec-01-java", "tema": "recursividad", "orden": 23,
        "titulo": "Factorial de un número",
        "enunciado": "Completa el método recursivo para que calcule el factorial de n.",
        "lenguaje": "java", "nivel": "avanzado",
        "codigo_base": "public class Main {\n    static int factorial(int n) {\n        if (n == 0) return 1;\n        return n * factorial(n);\n    }\n    public static void main(String[] args) {\n        System.out.println(factorial(5));\n    }\n}",
    },
    {
        "id": "rec-02-java", "tema": "recursividad", "orden": 24,
        "titulo": "Sucesión de Fibonacci",
        "enunciado": "Completa el método recursivo para que retorne el n-ésimo número de Fibonacci.",
        "lenguaje": "java", "nivel": "avanzado",
        "codigo_base": "public class Main {\n    static int fibonacci(int n) {\n        if (n <= 1) return n;\n        return fibonacci(n - 1);\n    }\n    public static void main(String[] args) {\n        System.out.println(fibonacci(6));\n    }\n}",
    },

    # --- TEMA 7: Programación orientada a objetos ---
    {
        "id": "poo-01-py", "tema": "poo", "orden": 25,
        "titulo": "Clase Estudiante",
        "enunciado": "Completa la clase para que el método mostrar_info() retorne el nombre y la carrera del estudiante.",
        "lenguaje": "python", "nivel": "avanzado",
        "codigo_base": "class Estudiante:\n    def __init__(self, nombre, carrera):\n        self.nombre = nombre\n\n    def mostrar_info(self):\n        return f\"{self.nombre} - {self.carrera}\"\n\ne = Estudiante(\"Roberto\", \"Ingenieria en Informatica\")\nprint(e.mostrar_info())",
    },
    {
        "id": "poo-02-py", "tema": "poo", "orden": 26,
        "titulo": "Herencia entre clases",
        "enunciado": "Completa la clase Perro para que herede de Animal y sobreescriba el método hacer_sonido().",
        "lenguaje": "python", "nivel": "avanzado",
        "codigo_base": "class Animal:\n    def hacer_sonido(self):\n        return \"...\"\n\nclass Perro:\n    def hacer_sonido(self):\n        return \"Guau\"\n\np = Perro()\nprint(p.hacer_sonido())",
    },
    {
        "id": "poo-01-java", "tema": "poo", "orden": 27,
        "titulo": "Clase Estudiante",
        "enunciado": "Completa la clase para que el método mostrarInfo() retorne el nombre y la carrera del estudiante.",
        "lenguaje": "java", "nivel": "avanzado",
        "codigo_base": "public class Estudiante {\n    String nombre;\n\n    public Estudiante(String nombre, String carrera) {\n        this.nombre = nombre;\n    }\n\n    public String mostrarInfo() {\n        return nombre + \" - \" + carrera;\n    }\n\n    public static void main(String[] args) {\n        Estudiante e = new Estudiante(\"Roberto\", \"Ingenieria en Informatica\");\n        System.out.println(e.mostrarInfo());\n    }\n}",
    },
    {
        "id": "poo-02-java", "tema": "poo", "orden": 28,
        "titulo": "Herencia entre clases",
        "enunciado": "Completa la clase Perro para que extienda de Animal y sobreescriba el método hacerSonido().",
        "lenguaje": "java", "nivel": "avanzado",
        "codigo_base": "class Animal {\n    String hacerSonido() {\n        return \"...\";\n    }\n}\n\nclass Perro {\n    String hacerSonido() {\n        return \"Guau\";\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Perro p = new Perro();\n        System.out.println(p.hacerSonido());\n    }\n}",
    },
]
