var map = new maptalks.Map('map', {
  center: [-0.113049,51.498568],
  zoom: 10,
  pitch: 60,
  baseLayer: new maptalks.TileLayer('base', {
    urlTemplate: '$(urlTemplate)',
    subdomains: $(subdomains),
    attribution: '$(attribution)'
  })
});
var url = '../../../../resource/gltf/running_tiger/scene.gltf';

var gltflayer = new maptalks.GLTFLayer('gltf').addTo(map);
var position = map.getCenter();
//phong光照作为对比
new maptalks.GLTFMarker(position.add(0.1, 0), {
  symbol : {
    url : url,
    animation : true,
    loop : true,
    rotation: [90, 0, 0]
  }
}).addTo(gltflayer)
var loader = new maptalksgl.reshader.ResourceLoader();
var hdr = new maptalksgl.reshader.Texture2D(
  {
      url: '../../../../resource/industrial_room.hdr',
      arrayBuffer: true,
      hdr: true,
      type: 'float16',
      format: 'rgba',
      flipY: true
  },
  loader
);
var sh = [
  [0.08225932717323303, 0.1296476572751999, 0.18428272008895874],
  [-0.004491398110985756, -0.0062361168675124645, -0.005997033789753914],
  [0.02749081887304783, 0.057795193046331406, 0.1145947203040123],
  [0.03964025899767876, 0.03352731838822365, 0.020897403359413147],
  [-0.005459152162075043, -0.008918278850615025, -0.011838626116514206],
  [0.017447197809815407, 0.016732292249798775, 0.012003022246062756],
  [-0.003052285173907876, -0.00440911715850234, -0.004788860213011503],
  [0.01575229875743389, 0.017373336479067802, 0.015197779051959515],
  [0.018414868041872978, 0.027235284447669983, 0.030140453949570656]
];
var PREFILTER_CUBE_SIZE = 256;
gltflayer.on('contextcreate', e => {
  hdr.once('complete', () => {
    iblMaps = createMaps(hdr, e.regl);
    const mipLevel = Math.log(PREFILTER_CUBE_SIZE) / Math.log(2);
    uniforms = {
        'uEnvironmentExposure': 2, //2
        'sIntegrateBRDF': iblMaps.dfgLUT,
        'sSpecularPBR': iblMaps.prefilterMap,
        'uDiffuseSPH': iblMaps.sh,
        'uTextureEnvironmentSpecularPBRLodRange': [mipLevel, mipLevel],
        'uTextureEnvironmentSpecularPBRTextureSize': [PREFILTER_CUBE_SIZE, PREFILTER_CUBE_SIZE],
        'uSketchfabLight0_diffuse': [1.4192, 1.3973, 1.4269, 1],
        'uSketchfabLight0_viewDirection': [0.6170, 0.6895, -0.3793],
        'uRGBMRange': 7.0,
        'polygonFill': [1.0, 1.0, 1.0, 1.0],
        'polygonOpacity': 0.8
    };
    new maptalks.GLTFMarker(position, {
        symbol : {
          url : url,
          animation : true,
          loop : true,
          shader : 'pbr',
          rotation: [90, 0, 0],
          uniforms
        }
    }).addTo(gltflayer);
  });
});

function createMaps(hdr, regl) {
  const maps = maptalksgl.reshader.pbr.PBRHelper.createIBLMaps(regl, {
      envTexture : hdr.getREGLTexture(regl),
      envCubeSize: 1024,
      prefilterCubeSize: PREFILTER_CUBE_SIZE,
      ignoreSH: true
  });
  maps.dfgLUT = maptalksgl.reshader.pbr.PBRHelper.generateDFGLUT(regl);

  maps.sh = sh;
  return maps;
}
