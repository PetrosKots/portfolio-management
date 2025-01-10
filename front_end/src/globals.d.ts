//Tells typescript how to handle css files as typescript only allows certain imports
declare module '*.css' {
    const classes: { [key: string]: string };
    export default classes;
  }

  