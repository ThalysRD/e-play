import styles from "styles/BackgroundShapes.module.css";

const BackgroundShapes = () => {
  return (
    <div className={styles.backgroundElements}>
      <div className={styles.blur}>
        {/* Right Pattern */}
        <div className={styles.rightPattern}>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
        </div>

        {/* Left Pattern */}
        <div className={styles.leftPattern}>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
        </div>

        {/* Center Pattern */}
        <div className={styles.centerPattern}>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
        </div>

        {/* Top Right Pattern */}
        <div className={styles.topRightPattern}>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
        </div>

        {/* Top Left Pattern */}
        <div className={styles.topLeftPattern}>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
        </div>

        {/* Bottom Right Pattern */}
        <div className={styles.bottomRightPattern}>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
        </div>

        {/* Bottom Left Pattern */}
        <div className={styles.bottomLeftPattern}>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
        </div>

        {/* Bottom Center Pattern */}
        <div className={styles.bottomCenterPattern}>
          <div className={styles.rectangle}></div>
          <div className={styles.rectangle}></div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundShapes;
