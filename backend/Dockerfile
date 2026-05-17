FROM eclipse-temurin:17-jdk-jammy

RUN apt-get update && apt-get install -y wget unzip zip curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk

# Install Android cmdline-tools
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
         -O /tmp/ct.zip && \
    unzip -q /tmp/ct.zip -d /tmp/ct && \
    mv /tmp/ct/cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools/latest && \
    rm -rf /tmp/ct.zip /tmp/ct

ENV PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/build-tools/34.0.0:$PATH"

# Accept licenses, install platform + build-tools + NDK r25c
# NOTE: NDK adds ~1.5 GB — first build takes longer but enables real JNI .so compilation
RUN yes | sdkmanager --licenses > /dev/null 2>&1 || true && \
    sdkmanager "platforms;android-33" "build-tools;34.0.0" "ndk;25.2.9519653"

ENV ANDROID_NDK_ROOT=$ANDROID_SDK_ROOT/ndk/25.2.9519653
ENV NDK_BIN=$ANDROID_SDK_ROOT/ndk/25.2.9519653/toolchains/llvm/prebuilt/linux-x86_64/bin
ENV PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/build-tools/34.0.0:$NDK_BIN:$PATH"

# Generate debug keystore for APK signing
RUN keytool -genkeypair -v \
    -keystore $ANDROID_SDK_ROOT/debug.jks \
    -alias debugkey -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass android -keypass android \
    -dname "CN=Android Debug,O=Android,C=US" 2>&1 | tail -1

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
