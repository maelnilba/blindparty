import { Container, ISourceOptions } from "@tsparticles/engine";
import { loadSeaAnemonePreset } from "@tsparticles/preset-sea-anemone";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import {
  ComponentPropsWithoutRef,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AnemoneProps = ComponentPropsWithoutRef<"div">;
export const Anemone = forwardRef<HTMLDivElement, AnemoneProps>(
  (props, parent) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => {
        window.removeEventListener("resize", checkMobile);
      };
    }, []);

    const [init, setInit] = useState(false);
    const container = useRef<Container>();

    const { scrollYProgress } = useScroll({
      target: parent as any,
    });

    const quantity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 6, 0]);

    const updateRateQuantity = (value: number) => {
      if (!container.current) return;
      const emitters = [
        (container.current as any).getEmitter(0),
        (container.current as any).getEmitter(1),
      ];

      emitters.forEach((emitter) => {
        emitter.options.rate.quantity = Math.min(isMobile ? 2 : 1000, value);
      });
    };

    useMotionValueEvent(quantity, "change", (lastValue) => {
      if (!(parent as any).current) return;
      updateRateQuantity(lastValue);
    });

    const timer = useRef<NodeJS.Timeout>();
    const containerLoaded = async (containerLoaded: Container | undefined) => {
      container.current = containerLoaded;
      timer.current = setTimeout(() => {
        updateRateQuantity(0.1);
      }, 2000);
    };

    useEffect(() => {
      initParticlesEngine(async (engine) => {
        await loadSeaAnemonePreset(engine);
      }).then(() => {
        setInit(true);
      });

      return () => timer.current && clearTimeout(timer.current);
    }, []);

    const options: ISourceOptions = useMemo(
      () => ({
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        preset: "seaAnemone",
        particles: {
          color: {
            value: [
              "#E40303",
              "#FF8C00",
              "#FFED00",
              "#008026",
              "#24408E",
              "#732982",
            ],
            // value: ["#5BCEFA", "#F5A9B8", "FFFFFF"],
          },
        },
        emitters: [
          {
            life: {
              duration: 5,
              count: 0,
            },
            rate: {
              delay: 0.05,
              quantity: 0,
            },
            position: {
              x: 0,
              y: 50,
            },
            particles: {
              move: {
                direction: "right",
              },
            },
          },
          {
            life: {
              duration: 5,
              count: 0,
            },
            rate: {
              delay: 0.05,
              quantity: 0,
            },
            position: {
              x: 100,
              y: 50,
            },
            particles: {
              move: {
                direction: "left",
              },
            },
          },
        ],
        responsive: [
          {
            maxWidth: 524,
            options: {
              emitters: [
                {
                  life: {
                    duration: 5,
                    count: 0,
                  },
                  rate: {
                    delay: 1,
                    quantity: 0,
                  },
                  position: {
                    x: 0,
                    y: 50,
                  },
                  particles: {
                    move: {
                      direction: "right",
                    },
                  },
                },
                {
                  life: {
                    duration: 5,
                    count: 0,
                  },
                  rate: {
                    delay: 1,
                    quantity: 0,
                  },
                  position: {
                    x: 100,
                    y: 50,
                  },
                  particles: {
                    move: {
                      direction: "left",
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

    if (init)
      return (
        <Particles
          id="tsparticles"
          particlesLoaded={containerLoaded}
          options={options}
        />
      );

    return <></>;
  }
);
