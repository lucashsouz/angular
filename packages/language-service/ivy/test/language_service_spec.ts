/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript/lib/tsserverlibrary';

import {LanguageService, parseNgCompilerOptions} from '../language_service';

import {MockService, setup, TEST_TEMPLATE} from './mock_host';

describe('language service adapter', () => {
  let project: ts.server.Project;
  let service: MockService;
  let ngLS: LanguageService;

  beforeAll(() => {
    const {project: _project, tsLS, service: _service} = setup();
    project = _project;
    service = _service;
    ngLS = new LanguageService(project, tsLS);
  });

  describe('parseNgCompilerOptions', () => {
    it('should read angularCompilerOptions in tsconfig.json', () => {
      const options = parseNgCompilerOptions(project);
      expect(options).toEqual(jasmine.objectContaining({
        enableIvy: true,  // default for ivy is true
        strictTemplates: true,
        strictInjectionParameters: true,
      }));
    });
  });

  describe('last known program', () => {
    beforeEach(() => {
      service.reset();
    });

    it('should be set after getSemanticDiagnostics()', () => {
      const d0 = ngLS.getSemanticDiagnostics(TEST_TEMPLATE);
      expect(d0.length).toBe(0);
      const p0 = getLastKnownProgram(ngLS);

      const d1 = ngLS.getSemanticDiagnostics(TEST_TEMPLATE);
      expect(d1.length).toBe(0);
      const p1 = getLastKnownProgram(ngLS);
      expect(p1).toBe(p0);  // last known program should not have changed

      service.overwrite(TEST_TEMPLATE, `<test-c¦omp></test-comp>`);
      const d2 = ngLS.getSemanticDiagnostics(TEST_TEMPLATE);
      expect(d2.length).toBe(0);
      const p2 = getLastKnownProgram(ngLS);
      expect(p2).not.toBe(p1);  // last known program should have changed
    });

    it('should be set after getDefinitionAndBoundSpan()', () => {
      const {position: pos0} = service.overwrite(TEST_TEMPLATE, `<test-c¦omp></test-comp>`);

      const d0 = ngLS.getDefinitionAndBoundSpan(TEST_TEMPLATE, pos0);
      expect(d0).toBeDefined();
      const p0 = getLastKnownProgram(ngLS);

      const d1 = ngLS.getDefinitionAndBoundSpan(TEST_TEMPLATE, pos0);
      expect(d1).toBeDefined();
      const p1 = getLastKnownProgram(ngLS);
      expect(p1).toBe(p0);  // last known program should not have changed

      const {position: pos1} = service.overwrite(TEST_TEMPLATE, `{{ ti¦tle }}`);
      const d2 = ngLS.getDefinitionAndBoundSpan(TEST_TEMPLATE, pos1);
      expect(d2).toBeDefined();
      const p2 = getLastKnownProgram(ngLS);
      expect(p2).not.toBe(p1);  // last known program should have changed
    });

    it('should be set after getQuickInfoAtPosition()', () => {
      const {position: pos0} = service.overwrite(TEST_TEMPLATE, `<test-c¦omp></test-comp>`);

      const q0 = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, pos0);
      expect(q0).toBeDefined();
      const p0 = getLastKnownProgram(ngLS);

      const q1 = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, pos0);
      expect(q1).toBeDefined();
      const p1 = getLastKnownProgram(ngLS);
      expect(p1).toBe(p0);  // last known program should not have changed

      const {position: pos1} = service.overwrite(TEST_TEMPLATE, `{{ ti¦tle }}`);
      const q2 = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, pos1);
      expect(q2).toBeDefined();
      const p2 = getLastKnownProgram(ngLS);
      expect(p2).not.toBe(p1);  // last known program should have changed
    });

    it('should be set after getTypeDefinitionAtPosition()', () => {
      const {position: pos0} = service.overwrite(TEST_TEMPLATE, `<test-c¦omp></test-comp>`);

      const q0 = ngLS.getTypeDefinitionAtPosition(TEST_TEMPLATE, pos0);
      expect(q0).toBeDefined();
      const p0 = getLastKnownProgram(ngLS);

      const d1 = ngLS.getTypeDefinitionAtPosition(TEST_TEMPLATE, pos0);
      expect(d1).toBeDefined();
      const p1 = getLastKnownProgram(ngLS);
      expect(p1).toBe(p0);  // last known program should not have changed

      const {position: pos1} = service.overwrite(TEST_TEMPLATE, `{{ ti¦tle }}`);
      const d2 = ngLS.getTypeDefinitionAtPosition(TEST_TEMPLATE, pos1);
      expect(d2).toBeDefined();
      const p2 = getLastKnownProgram(ngLS);
      expect(p2).not.toBe(p1);  // last known program should have changed
    });
  });
});

function getLastKnownProgram(ngLS: LanguageService): ts.Program {
  const program = ngLS['compilerFactory']['lastKnownProgram'];
  expect(program).toBeDefined();
  return program!;
}
