import { type Container, type ISourceOptions } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadConfettiPreset } from "@tsparticles/preset-confetti";
import { useEffect, useMemo, useState } from "react";
const App = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadConfettiPreset(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container);
  };

  const options: ISourceOptions = useMemo(
    () => ({
      preset: "confetti",
      background: {
        color: {
          value: "#000000",
        },
      },
      fpsLimit: 120,
      detectRetina: true,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "emitter",
          },
        },
        modes: {
          emitters: {
            direction: "none",
            spawnColor: {
              animation: {
                h: {
                  enable: true,
                  offset: {
                    min: -1.4,
                    max: 1.4,
                  },
                  speed: 0.1,
                  sync: false,
                },
                l: {
                  enable: true,
                  offset: {
                    min: 20,
                    max: 80,
                  },
                  speed: 0,
                  sync: false,
                },
              },
            },
            life: {
              count: 1,
              duration: 0.1,
              delay: 0.6,
            },
            rate: {
              delay: 0.1,
              quantity: 100,
            },
            size: {
              width: 0,
              height: 0,
            },
          },
        },
      },
      emitters: [
        {
          life: {
            duration: 5,
            count: 0,
          },
          rate: {
            delay: 0.1,
            quantity: 5,
          },
          position: {
            x: 0,
            y: 40,
          },
          particles: {
            move: {
              direction: "top-right",
            },
          },
        },
        {
          life: {
            duration: 5,
            count: 0,
          },
          rate: {
            delay: 0.1,
            quantity: 5,
          },
          position: {
            x: 100,
            y: 35,
          },
          particles: {
            move: {
              direction: "top-left",
            },
          },
        },
      ],
      particles: {
        color: {
          value: ["#0000ff", "#00ff00"],
        },
      },
      responsive: [
        {
          maxWidth: 600,
          options: {
            interactivity: {
              modes: {
                emitters: {
                  life: {
                    count: 1,
                    duration: 0.1,
                    delay: 0.6,
                  },
                  rate: {
                    delay: 0.1,
                    quantity: 10,
                  },
                },
              },
            },
            emitters: [
              {
                life: {
                  duration: 5,
                  count: 0,
                },
                rate: {
                  quantity: 1,
                },
                position: {
                  x: 0,
                  y: 20,
                },
                particles: {
                  move: {
                    direction: "top-right",
                  },
                },
              },
              {
                life: {
                  duration: 5,
                  count: 0,
                },
                rate: {
                  quantity: 1,
                },
                position: {
                  x: 100,
                  y: 50,
                },
                particles: {
                  move: {
                    direction: "top-left",
                  },
                },
              },
            ],
          },
        },
        {
          maxWidth: 1000,
          options: {
            interactivity: {
              modes: {
                emitters: {
                  life: {
                    count: 1,
                    duration: 0.1,
                    delay: 0.6,
                  },
                  rate: {
                    delay: 0.1,
                    quantity: 50,
                  },
                },
              },
            },
            emitters: [
              {
                life: {
                  duration: 5,
                  count: 0,
                },
                rate: {
                  quantity: 3,
                },
                position: {
                  x: 0,
                  y: 50,
                },
                particles: {
                  move: {
                    direction: "top-right",
                  },
                },
              },
              {
                life: {
                  duration: 5,
                  count: 0,
                },
                rate: {
                  quantity: 3,
                },
                position: {
                  x: 100,
                  y: 50,
                },
                particles: {
                  move: {
                    direction: "top-left",
                  },
                },
              },
            ],
          },
        },
      ],
    }),
    []
  );

  if (init) {
    return (
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
      />
    );
  }

  return <></>;
};

export default App;
