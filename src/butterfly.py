
import turtle
import math
import random
import colorsys

# -------------------------------
# 1. SCREEN SETUP
# -------------------------------
screen = turtle.Screen()
screen.setup(width=900, height=750)
screen.bgcolor("#02010b")
screen.title("Butterfly Particle Animation")
screen.tracer(0)

pen = turtle.Turtle()
pen.hideturtle()
pen.speed(0)
pen.penup()

# -------------------------------
# 2. BUTTERFLY SETTINGS
# -------------------------------
TOTAL_PARTICLES = 2400
BUTTERFLY_SIZE = 100
particles = []

# -------------------------------
# 3. CREATE BUTTERFLY SHAPE
# -------------------------------
for i in range(TOTAL_PARTICLES):

    # Angle around the butterfly curve
    angle = random.uniform(0, 12 * math.pi)

    # Mathematical butterfly curve
    radius = (
        math.exp(math.cos(angle))
        - 2 * math.cos(4 * angle)
        + math.sin(angle / 12) ** 5
    )

    # Butterfly boundary coordinates
    x = radius * math.sin(angle)
    y = radius * math.cos(angle)

    # Spread particles inside the four wings
    spread = random.uniform(0.18, 1.0)

    x = x * BUTTERFLY_SIZE * spread
    y = y * BUTTERFLY_SIZE * spread

    # Small natural variation
    x += random.uniform(-2, 2)
    y += random.uniform(-2, 2)

    # Blue, cyan, violet and pink colors
    hue = random.choice([
        0.52, 0.57, 0.62, 0.70, 0.79, 0.88
    ])

    rgb = colorsys.hsv_to_rgb(hue, 0.85, 1.0)

    color = "#{:02x}{:02x}{:02x}".format(
        int(rgb[0] * 255),
        int(rgb[1] * 255),
        int(rgb[2] * 255)
    )

    size = random.choice([1, 2, 2, 3])

    # Save each particle
    particles.append([x, y, color, size])

# -------------------------------
# 4. ANIMATION VARIABLES
# -------------------------------
frame = 0
GROW_FRAMES = 65


# -------------------------------
# 5. DRAW THE BUTTERFLY
# -------------------------------
def draw_butterfly():

    global frame

    pen.clear()

    # Gradually grow from the center
    if frame < GROW_FRAMES:
        progress = frame / GROW_FRAMES

        # Smooth growth effect
        progress = progress * progress * (3 - 2 * progress)

        scale = 0.03 + 0.97 * progress
    else:
        scale = 1.0

    # Draw all particles
    for x, y, color, size in particles:

        # Tiny movement after the butterfly appears
        if frame >= GROW_FRAMES:
            move_x = random.uniform(-0.35, 0.35)
            move_y = random.uniform(-0.35, 0.35)
        else:
            move_x = 0
            move_y = 0

        draw_x = x * scale + move_x
        draw_y = y * scale + move_y

        pen.goto(draw_x, draw_y)
        pen.dot(size, color)

    # Bright glowing center
    pen.goto(0, 0)
    pen.dot(18, "#143cff")
    pen.dot(11, "#00cfff")
    pen.dot(5, "#ffffff")

    screen.update()

    frame += 1

    # Repeat the animation
    screen.ontimer(draw_butterfly, 40)


# -------------------------------
# 6. START THE ANIMATION
# -------------------------------
draw_butterfly()

turtle.done()
