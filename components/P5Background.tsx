import React, { useEffect, useRef } from 'react';

// Since p5.js is loaded via a script tag, we need to declare it globally for TypeScript
declare global {
  interface Window {
    p5: any;
  }
}

const P5Background: React.FC = () => {
    const sketchRef = useRef<HTMLDivElement>(null);
    const p5Instance = useRef<any | null>(null);

    useEffect(() => {
        if (!sketchRef.current || !window.p5) return;

        const sketch = (p: any) => {
            let clusters: any[][] = [];
            let hulls: any[][] = [];

            const initSketch = () => {
                let syze = p.min(p.width, p.height) * 3 / 4;
                let points: any[] = [];
                for (let i = 0; i < 2000; i++) {
                    points.push(p.createVector(p.width / 2 + p.random(-syze / 2, syze / 2), p.height / 2 + p.random(-syze / 2, syze / 2)));
                }
                clusters = divide(points);
                hulls = [convexHull(clusters[0]), convexHull(clusters[1])];
            };

            p.setup = () => {
                p.createCanvas(p.windowWidth, p.windowHeight);
                p.noStroke();
                initSketch();
            };

            p.draw = () => {
                p.clear();
                p.fill(255, 30); // More transparent white for a subtle effect
                for (let hull of hulls) {
                    if (hull.length > 3) {
                        p.beginShape();
                        for (let pt of hull) {
                            p.vertex(pt.x, pt.y);
                        }
                        p.endShape(p.CLOSE);
                    }
                }
            };

            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
                initSketch();
            };

            p.mouseReleased = () => {
                let mouseVec = p.createVector(p.mouseX, p.mouseY);
                let argmin = -1;
                let minDist = p.width * p.height;

                for (let i = 0; i < clusters.length; i++) {
                    for (let q of clusters[i]) {
                        let d = distSquared(mouseVec, q);
                        if (d < minDist) {
                            argmin = i;
                            minDist = d;
                        }
                    }
                }

                if (argmin !== -1 && hulls[argmin] && hulls[argmin].length > 5) {
                    let clu = clusters.splice(argmin, 1)[0];
                    let newClusters = divide(clu);
                    if (newClusters[0].length > 0 && newClusters[1].length > 0) {
                        clusters = [...clusters, ...newClusters];
                        hulls.splice(argmin, 1);
                        hulls.push(convexHull(newClusters[0]), convexHull(newClusters[1]));
                    } else {
                        clusters.splice(argmin, 0, clu);
                    }
                }
                return false;
            };
            
            const distSquared = (pt1: any, pt2: any) => {
                return p.sq(pt1.x - pt2.x) + p.sq(pt1.y - pt2.y);
            };
            
            const divide = (points: any[]): any[][] => {
                if (points.length < 2) return [points, []];

                let newClusters: any[][] = [[], []];
                let centroids: any[] = [];
                
                let c1 = p.random(points);
                centroids.push(c1);
                let c2;
                do {
                    c2 = p.random(points);
                } while (c1 && c2 && c1.equals(c2));
                centroids.push(c2);

                for (let pt of points) {
                    let d1 = distSquared(pt, centroids[0]);
                    let d2 = distSquared(pt, centroids[1]);
                    if (d1 < d2) {
                        newClusters[0].push(pt);
                    } else {
                        newClusters[1].push(pt);
                    }
                }
                
                return newClusters;
            };
            
            const convexHull = (points: any[]): any[] => {
                if (points.length <= 2) return points;
                
                points.sort((a, b) => a.x - b.x);
                let hull: any[] = [];
                let pointOnHull = points[0];
                let endPoint;
                
                do {
                    hull.push(pointOnHull);
                    endPoint = points[0];
                    for (let j = 0; j < points.length; j++) {
                        let currentPoint = points[j];
                        let crossProductZ = (endPoint.x - pointOnHull.x) * (currentPoint.y - pointOnHull.y) - (endPoint.y - pointOnHull.y) * (currentPoint.x - pointOnHull.x);

                        if (endPoint.equals(pointOnHull) || crossProductZ < 0) {
                            endPoint = currentPoint;
                        }
                    }
                    pointOnHull = endPoint;
                } while (pointOnHull && !pointOnHull.equals(points[0]));

                return hull;
            };
        };

        p5Instance.current = new window.p5(sketch, sketchRef.current);
        
        return () => {
            p5Instance.current?.remove();
        };
    }, []);

    return <div ref={sketchRef} className="fixed top-0 left-0 -z-10" />;
};

export default P5Background;